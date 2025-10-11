import {Injectable, NgZone, Injector} from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import type { UserService } from './user.service';
import {NotificationStoreService} from "./notification-store-service.service";
import {Router} from "@angular/router";
import {Subject} from "rxjs";

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
  private socket: Socket | null = null;
  private isInitialized = false;
  private userService: UserService;

  public dealCreated$ = new Subject<any>();
  public dealStatusUpdated$ = new Subject<any>();

  constructor(private injector: Injector, private notificationStoreService: NotificationStoreService, private router: Router, private ngZone: NgZone) {}

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
    if (!user || !user.id) {
      console.warn('🔶 Socket connection attempted without valid user data');
      return;
    }

    console.log(`🔌 Attempting socket connection for user ID: ${user.id}`);
    this.socket = io(environment.SERVER_URL, {
      auth: { userID: user.id },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true // Ensure fresh connection
    });

    // Add connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully with ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Socket disconnected:', reason);
      // Don't try to reconnect if user data is invalid
      const currentUser = this.getUserService().getUser();
      if (!currentUser || !currentUser.id) {
        console.warn('🔶 User data invalid, preventing reconnection');
        this.disconnectSocket();
      }
    });

    // Handle reconnection attempts
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      const currentUser = this.getUserService().getUser();
      if (!currentUser || !currentUser.id) {
        console.warn('🔶 Preventing reconnection attempt without valid user');
        this.socket?.disconnect();
        return;
      }
      // Update auth info for reconnection
      this.socket!.auth = { userID: currentUser.id };
      console.log(`🔄 Reconnection attempt ${attemptNumber} with user ID: ${currentUser.id}`);
    });

   this.listenForNotifications();

   this.listenForDealCreated();
   this.listenForDealStatusUpdated();

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

  private listenForDealCreated() {
    if (!this.socket) return;

    this.socket.on('deal_created', (data) => {
      this.dealCreated$.next(data);
    });
  }

  private listenForDealStatusUpdated() {
    if (!this.socket) return;

    this.socket.on('deal_status_updated', (data) => {
      console.log('📥 Deal status updated:', data);
      this.dealStatusUpdated$.next(data);
    });
  }

  disconnectSocket() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket manually');
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }

  // Method to reset connection (useful when user logs out/in)
  resetConnection() {
    this.disconnectSocket();
    this.connectSocket();
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
