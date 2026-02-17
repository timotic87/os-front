import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

const STORAGE_KEY = 'os_notifications';
const STORAGE_USER_KEY = 'os_notifications_user';

@Injectable({ providedIn: 'root' })
export class NotificationStoreService {

  toggleValue = false;
  toggleNotificationBar = new Subject<boolean>();

  private _notifications = new BehaviorSubject<any[]>([]);
  notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  private injector: Injector;

  constructor(injector: Injector) {
    this.injector = injector;
  }

  /** Call on login with the logged-in user's ID */
  initForUser(userId: number) {
    const storedUserId = localStorage.getItem(STORAGE_USER_KEY);
    if (storedUserId && Number(storedUserId) !== userId) {
      this.persist([]);
    }
    localStorage.setItem(STORAGE_USER_KEY, String(userId));

    // Load from localStorage first (instant)
    const cached = this.loadFromStorage();
    this._notifications.next(cached);
    this._unreadCount.next(cached.filter(n => !n.isRead).length);

    // Then fetch from server to sync
    this.fetchFromServer();
  }

  private fetchFromServer() {
    try {
      const { RestService } = require('./rest.service');
      const rest = this.injector.get(RestService);
      rest.getNotifications().subscribe({
        next: (res: any) => {
          if (res?.data) {
            const sorted = this.sort(res.data);
            this.persist(sorted);
            this._notifications.next(sorted);
            this._unreadCount.next(sorted.filter(n => !n.isRead).length);
          }
        },
        error: () => { /* keep localStorage data on error */ }
      });
    } catch (e) { /* RestService not available yet */ }
  }

  addNotification(notification: any) {
    const current = this._notifications.value;
    if (notification.id && current.some(n => n.id === notification.id)) {
      return;
    }
    const updated = this.sort([notification, ...current]);
    this.persist(updated);
    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }

  clearNotifications() {
    this.persist([]);
    this._notifications.next([]);
    this._unreadCount.next(0);
  }

  removeNotification(id: number) {
    const updated = this._notifications.value.filter(n => n.id !== id);
    this.persist(updated);
    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }

  resortNotifications() {
    const updated = this.sort(this._notifications.value);
    this.persist(updated);
    this._notifications.next(updated);
  }

  markAllAsRead() {
    // Update locally immediately
    const updated = this._notifications.value.map(n => ({ ...n, isRead: true }));
    this.persist(updated);
    this._notifications.next(updated);
    this._unreadCount.next(0);

    // Sync to backend
    try {
      const { RestService } = require('./rest.service');
      const rest = this.injector.get(RestService);
      rest.markAllAsRead().subscribe({
        error: () => { /* local state already updated */ }
      });
    } catch (e) {}
  }

  markNotificationAsRead(id: number) {
    const updated = this._notifications.value.map(n => {
      if (n.id === id) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.persist(updated);
    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }

  private sort(notifications: any[]): any[] {
    return [...notifications].sort((a, b) => {
      // Flagged first
      if (a.flagged && !b.flagged) return -1;
      if (!a.flagged && b.flagged) return 1;
      // Then by date (newest first)
      const dateA = new Date(a.creationDate || 0).getTime();
      const dateB = new Date(b.creationDate || 0).getTime();
      return dateB - dateA;
    });
  }

  private persist(notifications: any[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {}
  }

  private loadFromStorage(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? this.sort(JSON.parse(data)) : [];
    } catch (e) {
      return [];
    }
  }
}
