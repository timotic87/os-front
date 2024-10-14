import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {NotificationModel} from "../models/notificationModel";

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  sideBarShowSub = new Subject<boolean>();
  notificationDeletedSubject = new Subject<NotificationModel[]>();

  numberOfNotifications = 0;
  numbNotiChange = new Subject<number>();

  showNotificationSideBar = false;

  notifications: NotificationModel[] = [];

  constructor() { }

  showNotification(data){
    Notification.requestPermission(status=>{
      if (status === "granted"){
        new Notification(data.title,{body: data.body, icon: "../../assets/mp_icon32.png"});
      }
    })
  }

  createNotificationList(data: any): any {
    this.notifications = []
    for (let item of data) {
      this.notifications.push(NotificationModel.notificationCreator(item));
    }
    this.numberOfNotifications = this.notifications.filter(item => item.isRead === false).length;
    this.numbNotiChange.next(this.numberOfNotifications);
    this.sortNotifications();
    return this.notifications
  }

  sortNotifications() {
    this.notifications.sort((a, b) => {
      // Prvo sortiraj po flagged
      if (a.flagged && !b.flagged) return -1;
      if (!a.flagged && b.flagged) return 1;

      // Zatim sortiraj po isRead
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;

      // Na kraju sortiraj po datumu
      return a.dateTime.getDate() - b.dateTime.getDate();
    });
  }

  deleteNotificationById(id: number) {
    this.notifications = this.notifications.filter(item => item.id !== id);
    this.notificationDeletedSubject.next(this.notifications);
  }

}
