import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationStoreService {

  toggleValue = false;
  toggleNotificationBar = new Subject<boolean>();

  private _notifications = new BehaviorSubject<any[]>([]);
  notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  addNotification(notification: any) {
    const current = this._notifications.value;
    const updated = [notification, ...current];

    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }

  clearNotifications() {
    this._notifications.next([]);
    this._unreadCount.next(0);
  }

  removeNotification(id: number) {
    const updated = this._notifications.value.filter(n => n.id !== id);
    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }

  markAllAsRead() {
    const updated = this._notifications.value.map(n => ({ ...n, isRead: true }));
    this._notifications.next(updated);
    this._unreadCount.next(0);
  }

  markNotificationAsRead(id: number) {
    const updated = this._notifications.value.map(n => {
      if (n.id === id) {
        return { ...n, isRead: true };
      }
      return n;
    });

    this._notifications.next(updated);
    this._unreadCount.next(updated.filter(n => !n.isRead).length);
  }

}
