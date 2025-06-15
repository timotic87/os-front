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

  constructor(router: Router, private userService: UserService, private notificationSocketService: NotificationSocketService, private rest: RestService,
              public notificationStoreService: NotificationStoreService) {
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

    this.rest.getNotifications().subscribe({
      next: res=>{
        if (res.status == 200) {
          res.data.forEach((item) => {
            this.notificationStoreService.addNotification(item);
          })
        }
      },
      error: err=>{
        console.log(err)
      }
    })


    // 🟢 Ako postoji validan korisnik, konektuj socket
    if (user && user.id) {
      this.notificationSocketService.connectSocket();
    }
  }

  closeNotifications(){
    this.notificationStoreService.toggleValue = false;
    this.notificationStoreService.toggleNotificationBar.next(false)
  }

}
