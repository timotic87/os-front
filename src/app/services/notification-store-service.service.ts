// services/notification-store.service.ts
import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationStoreService {

  toggleValue = false;
  toggleNotificationBar = new Subject<boolean>();

  public _notifications = new BehaviorSubject<any[]>([]);
  notifications$ = this._notifications.asObservable();

  addNotification(notification: any) {
    const current = this._notifications.value;
    this._notifications.next([notification, ...current]); // dodaj na početak
  }

  clearNotifications() {
    this._notifications.next([]);
  }

}
