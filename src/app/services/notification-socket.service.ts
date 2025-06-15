import {Injectable, NgZone} from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { Observable } from 'rxjs';
import {NotificationStoreService} from "./notification-store-service.service";
import {Router} from "@angular/router";

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
  private socket: Socket | null = null;
  private isInitialized = false;

  constructor(private userService: UserService, private notificationStoreService: NotificationStoreService, private router: Router, private ngZone: NgZone) {}

 connectSocket() {
    if (this.isInitialized) return;

    const user = this.userService.getUser();
    if (!user || !user.id) return;

    this.socket = io(environment.SERVER_URL, {
      auth: { userID: user.id },
    });

   this.listenForNotifications();

    this.isInitialized = true;
  }

  private listenForNotifications() {
    if (!this.socket) return;

    this.socket.on('notification', (data) => {
      console.log('📥 Primljena notifikacija:', data);
      this.notificationStoreService.addNotification(data);

      // 🖥️ Windows notifikacija
      if (Notification.permission === "granted") {
        const notification = new Notification(data.msg, {
          body: data.creator?.firstname ? `Od: ${data.creator.firstname}` : '',
          icon: '/assets/icons/logo-128.png', // zameni ako želiš drugi ikon
        });

        notification.onclick = () => {
          window.focus();

          const link = data.link && typeof data.link === 'string' ? data.link : '/';
          this.ngZone.run(() => {
            this.router.navigateByUrl(link);
          });
        };
      }
    });
  }




}
