import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NavigationStart, Router, RouterOutlet} from '@angular/router';
import {NavbarComponent} from "./navbar/navbar.component";
import { io, Socket } from 'socket.io-client'
import {environment} from "../environments/environment.development";
import {NotificationsService} from "./services/notifications.service";
import { socketEnum } from "./services/enum-sevice";
import {ClientsService} from "./services/clients.service";
import {UserService} from "./services/user.service";
import {NotificationCardComponent} from "./customComponents/notification-card/notification-card.component";
import {RestService} from "./services/rest.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,NavbarComponent, NotificationCardComponent],
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
      switch (data.listenerNum){
        case socketEnum.DELETE_CLIENT:
          clientService.isListChange.next(true);
          break;
        case socketEnum.CREATE_CDCM:
          // const cdcm = CDCM.createCDCMModel(data.cdcmData);
          // if (cdcm.createdUserID!==userService.getUser().id) this.cdcmService.newCDCMSubject.next(cdcm);
          break;
        case socketEnum.NEW_APPROVAL:
          this.rest.getLastNotification(3).subscribe(res=>{
            if (res.status===200 && res.data.length!==0){
              notificationsService.showNotification({title: userService.getUser().fullName+' time to approval', body: res.data[0].msg});
            }
          })

      }
      try {
        if(data.creatorID!==userService.getUser().id){
          this.rest.isNotificationShow(data.listenerNum).subscribe(res=>{
            if (res.data[0].isShow===1){
              notificationsService.showNotification(data);
            }
          })
          this.updateNotificationList();
        }
      }catch (err){
        console.log(err);
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
