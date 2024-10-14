import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NavigationStart, Router, RouterOutlet} from '@angular/router';
import { LoginComponent } from "./login/login.component";
import {ClientsComponent} from "./clients/clients.component";
import {NavbarComponent} from "./navbar/navbar.component";
import { io, Socket } from 'socket.io-client'
import {environment} from "../environments/environment.development";
import {NotificationsService} from "./services/notifications.service";
import { socketEnum } from "./services/enum-sevice";
import {ClientsService} from "./services/clients.service";
import {UserService} from "./services/user.service";
import {MatToolbar} from "@angular/material/toolbar";
import {MatSidenav, MatSidenavContainer} from "@angular/material/sidenav";
import {NotificationCardComponent} from "./customComponents/notification-card/notification-card.component";
import {RestService} from "./services/rest.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoginComponent, ClientsComponent, NavbarComponent, MatToolbar, MatSidenavContainer, MatSidenav, NotificationCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'OneSpot';
  link: string;
  socket: Socket;
  notificationList = [];
  constructor(router: Router,
              notificationsService: NotificationsService, private rest: RestService, clientService: ClientsService,
              private userService: UserService, public notificationService: NotificationsService) {
    notificationsService.sideBarShowSub.subscribe(show=>{
      this.notificationService.showNotificationSideBar = show
    });
    try{
      this.updateNotificationList();
    }catch (error){
      console.log(error)
    }
    userService.isUserLogedIn.subscribe(isIn=>{
      if (isIn){
        this.updateNotificationList();
      }
    });

    this.socket = io(environment.SERVER_URL)
    // @ts-ignore
    this.socket.on("mpsocket", data=>{
      console.log(this.userService.socketID)
      if(data.socketData.userId!==userService.getUser().id){
        console.log(data.listenerNum)
        notificationsService.showNotification(data);
        switch (data.listenerNum){
          case socketEnum.DELETE_CLIENT:
            this.updateNotificationList();
            clientService.isListChange.next(true);
            break;
        }
      }

    })

    router.events.forEach((event) => {

      if(event instanceof NavigationStart) {
        this.link = event.url;
      }
    });

    notificationsService.notificationDeletedSubject.subscribe(arr=>{
      this.notificationList = arr;
    });
  }

  updateNotificationList(){
    this.rest.getNotifications(this.userService.getUser().id).subscribe(res=>{
      if (res.status===200) {
        this.notificationList = this.notificationService.createNotificationList(res.data);
      }
    });
  }

  hideSidebar(){
    this.notificationService.sideBarShowSub.next(!this.notificationService.showNotificationSideBar)
  }


}
