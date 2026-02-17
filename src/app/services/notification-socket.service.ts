import {Injectable, NgZone, Injector} from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import type { UserService } from './user.service';
import {NotificationStoreService} from "./notification-store-service.service";
import {Router} from "@angular/router";
import {CookieService} from "ngx-cookie-service";
import {Subject} from "rxjs";

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
  private socket: Socket | null = null;
  private isInitialized = false;
  private userService: UserService;

  constructor(
    private injector: Injector,
    private notificationStoreService: NotificationStoreService,
    private router: Router,
    private ngZone: NgZone,
    private cookieService: CookieService
  ) {}

  private getUserService(): UserService {
    if (!this.userService) {
      const { UserService } = require('./user.service');
      this.userService = this.injector.get(UserService);
    }
    return this.userService;
  }

  connectSocket() {
    if (this.isInitialized) return;

    const user = this.getUserService().getUser();
    if (!user || !user.id) return;

    const token = this.cookieService.get('jwt');
    if (!token) return;

    this.socket = io(environment.SERVER_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });

    this.socket.on('connect_error', (error) => {
      if (error.message === 'Invalid token' || error.message === 'Authentication required') {
        this.disconnectSocket();
      }
    });

    this.socket.on('reconnect_attempt', () => {
      const currentUser = this.getUserService().getUser();
      if (!currentUser || !currentUser.id) {
        this.disconnectSocket();
        return;
      }
      const currentToken = this.cookieService.get('jwt');
      if (this.socket) {
        this.socket.auth = { token: currentToken };
      }
    });

    this.listenForNotifications();
    this.listenForDealCreated();
    this.listenForDealStatusUpdated();
    this.listenForRecruitingOrderCreated();

    this.isInitialized = true;
  }

  private listenForNotifications() {
    if (!this.socket) return;

    this.socket.on('notification', (data) => {
      this.notificationStoreService.addNotification(data);

      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(data.msg, {
          body: data.creator?.firstname ? `From: ${data.creator.firstname}` : '',
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

  private listenForDealCreated() {
    if (!this.socket) return;
    this.socket.on('deal_created', (data) => {
      this.dealCreated$.next(data);
    });
  }

  private listenForDealStatusUpdated() {
    if (!this.socket) return;
    this.socket.on('deal_status_updated', (data) => {
      this.dealStatusUpdated$.next(data);
    });
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }

  resetConnection() {
    this.disconnectSocket();
    this.connectSocket();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public dealCreated$ = new Subject<any>();
  public dealStatusUpdated$ = new Subject<any>();
  public recruitingOrderCreated$ = new Subject<any>();

  private listenForRecruitingOrderCreated() {
    if (!this.socket) return;
    this.socket.on('recruiting_order_created', (data) => {
      this.recruitingOrderCreated$.next(data);
    });
  }
}
