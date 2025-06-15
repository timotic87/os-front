import {Component, Input, OnInit} from '@angular/core';
import {ColorLabelComponent} from "../color-label/color-label.component";
import {DatePipe, NgIf} from "@angular/common";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {NotificationStoreService} from "../../services/notification-store-service.service";

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
export class NotificationCardComponent implements OnInit {

  @Input() notification: any;

  constructor(private rest: RestService, private dialogService: DialogService, private notificationStoreService: NotificationStoreService) {

  }

  changeIsRead(id) {
    this.rest.markAsRead({id}).subscribe({
      next: res=>{
        this.notification.isRead=true;
        this.notificationStoreService.markNotificationAsRead(id)
      },
      error: err => {
        console.log(err)
      }
    })

  }

  flaggedChange(id){
    this.rest.changeNotificationFlaggedStatus({id}).subscribe({
      next: res=>{
        this.notification.flagged = res.data
      },
      error: err => {
        console.log(err)
      }
    })
  }

  deleteNotification() {
    this.rest.deleteNotificationById(this.notification.id).subscribe({
      next: ()=>{
        this.notificationStoreService.removeNotification(this.notification.id)
      },
      error: err => {
        console.log(err);
      }
    })
  }

  ngOnInit(): void {
  }

}
