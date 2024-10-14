import {Component, Input} from '@angular/core';
import {ColorLabelComponent} from "../color-label/color-label.component";
import {NotificationModel} from "../../models/notificationModel";
import {DatePipe, NgIf} from "@angular/common";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {NotificationsService} from "../../services/notifications.service";

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [
    ColorLabelComponent,
    DatePipe,
    NgIf
  ],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.css'
})
export class NotificationCardComponent {

  @Input() notification: NotificationModel;

  constructor(private rest: RestService, private dialogService: DialogService, private notificationService: NotificationsService) {
  }

  changeIsRead(notification: NotificationModel) {
    this.rest.changeNotificationStatus({id: notification.id, status: notification.isRead}).subscribe(res=>{
      if (res.status == 201) {
        this.dialogService.showSnackBar('Uspesno se promenili status notifikacije', '', 3000);
        notification.isRead = !notification.isRead;
        this.notificationService.numberOfNotifications = this.notificationService.numberOfNotifications-1
        this.notificationService.numbNotiChange.next(this.notificationService.numberOfNotifications)
      }
    });
  }

  flaggedChange(notification){
    this.rest.changeNotificationFlaggedStatus({id: notification.id, status: notification.flagged}).subscribe(res=>{
      if (res.status == 201) {
        notification.flagged = !notification.flagged
        this.notificationService.sortNotifications()
      }
    });
  }

  deleteNotification(notification: NotificationModel) {
    this.dialogService.showChooseDialog("\"Are you sure you want to delete this notification?").afterClosed().subscribe(isYes=>{
      if (isYes){
        this.rest.deleteNotificationById(notification.id).subscribe(res=>{
          if (res.status === 201){
            this.dialogService.showSnackBar('You have successfully deleted the notification.', '', 3000);
            this.notificationService.deleteNotificationById(notification.id);
            if (this.notificationService.notifications.length===0){
              this.notificationService.sideBarShowSub.next(false);
            }
            if (!notification.isRead){
              this.notificationService.numberOfNotifications = this.notificationService.numberOfNotifications-1
              this.notificationService.numbNotiChange.next(this.notificationService.numberOfNotifications)
            }
          }else {
            this.dialogService.errorDialog(res);
          }
        })
      }
    })

  }

}
