import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {NavigationStart, Router, RouterOutlet} from '@angular/router';
import {NavbarComponent} from "./navbar/navbar.component";
import {Socket} from "socket.io-client";
import {UserService} from "./services/user.service";
import {NotificationSocketService} from "./services/notification-socket.service";
import {RestService} from "./services/rest.service";
import {NotificationStoreService} from "./services/notification-store-service.service";
import {NotificationCardComponent} from "./customComponents/notification-card/notification-card.component";
import {DialogService} from "./services/dialog.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, NotificationCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'OneSpot';
  link: string;
  socket: Socket;

  shownotBar = false;

  notificationList = [];

  constructor(router: Router, private userService: UserService, private notificationSocketService: NotificationSocketService,
              private rest: RestService, public notificationStoreService: NotificationStoreService, private dialogService: DialogService) {
    router.events.forEach((event) => {

      if(event instanceof NavigationStart) {
        this.link = event.url;
      }
    });
    notificationStoreService.toggleNotificationBar.subscribe((event) => {
      this.shownotBar = event;
    });

    this.notificationStoreService.notifications$.subscribe(list => {
      this.notificationList = list;
    });
  }

  ngOnInit(): void {

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const user = this.userService.getUser();


    // 🟢 Ako postoji validan korisnik, konektuj socket
    if (user && user.id) {
      this.notificationSocketService.connectSocket();
    }
  }

  closeNotifications(){
    this.notificationStoreService.toggleValue = false;
    this.notificationStoreService.toggleNotificationBar.next(false)
  }

  deleteAllNotification(){
    this.dialogService.showChooseDialog("Are you sure you want to clear all notifications?").afterClosed().subscribe(isYes=>{
      if(isYes){
        this.dialogService.showLoader();
        this.rest.deleteAllNotification().subscribe({
          next: res=>{
            this.dialogService.closeLoader();
            this.notificationStoreService.clearNotifications();

          },
          error: err=>{
            this.dialogService.closeLoader();
            this.dialogService.showMsgDialog('❌ Greška prilikom brisanja notifikacija: ' + (err.error?.message || err.status));
          }
        });
      }

    });
  }

}
