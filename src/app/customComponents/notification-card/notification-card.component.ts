import {Component, Input} from '@angular/core';
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";
import {RestService} from "../../services/rest.service";
import {NotificationStoreService} from "../../services/notification-store-service.service";

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.css'
})
export class NotificationCardComponent {

  @Input() notification: any;

  constructor(private rest: RestService, private notificationStoreService: NotificationStoreService, private router: Router) {}

  changeIsRead(id) {
    this.rest.markAsRead({id}).subscribe({
      next: () => {
        this.notification.isRead = true;
        this.notificationStoreService.markNotificationAsRead(id);
      },
      error: err => { console.error(err); }
    });
  }

  flaggedChange(id) {
    this.rest.changeNotificationFlaggedStatus({id}).subscribe({
      next: res => {
        this.notification.flagged = res.data;
        this.notificationStoreService.resortNotifications();
      },
      error: err => { console.error(err); }
    });
  }

  deleteNotification() {
    this.rest.deleteNotificationById(this.notification.id).subscribe({
      next: () => { this.notificationStoreService.removeNotification(this.notification.id); },
      error: err => { console.error(err); }
    });
  }

  navigateToLink() {
    if (this.notification.link) {
      this.notificationStoreService.toggleValue = false;
      this.notificationStoreService.toggleNotificationBar.next(false);
      this.router.navigateByUrl(this.notification.link);
    }
  }
}
