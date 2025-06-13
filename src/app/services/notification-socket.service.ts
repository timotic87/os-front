import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { Observable } from 'rxjs';
import {NotificationStoreService} from "./notification-store-service.service";

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
  private socket: Socket | null = null;
  private isInitialized = false;

  constructor(private userService: UserService, private notificationStoreService: NotificationStoreService) {}

 connectSocket() {
    if (this.isInitialized) return;

    const user = this.userService.getUser();
    if (!user || !user.id) return;

    this.socket = io(environment.SERVER_URL, {
      auth: { userID: user.id },
    });

    this.isInitialized = true;
  }

  listenForNotifications(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('notification', data => {
        this.notificationStoreService.addNotification(data); // <- dodajemo u state
        observer.next(data);
      });
    });
  }

}
