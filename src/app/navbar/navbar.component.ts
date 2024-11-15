import { Component } from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {UserService} from "../services/user.service";
import {MatMenu, MatMenuItem, MatMenuTrigger,} from "@angular/material/menu";
import {MatIconModule} from '@angular/material/icon';
import {CookieService} from "ngx-cookie-service";
import {DialogService} from "../services/dialog.service";
import {MatDialog} from "@angular/material/dialog";
import {
  ChangePasswordDialogComponent
} from "../admin/adminPages/users-admin/change-password-dialog/change-password-dialog.component";
import {NotificationsService} from "../services/notifications.service";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatIconModule,
    RouterLinkActive,
    RouterLink,
    NgIf
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  numberOfNotifications = 0;

  constructor(public userService: UserService, private cookieService: CookieService, private router: Router, private dialog: MatDialog,
              public notificationsService: NotificationsService, private dialogService: DialogService) {
    notificationsService.numbNotiChange.subscribe(numb=>{
      this.numberOfNotifications = numb
    });

  }

  logout(){
    this.cookieService.delete('jwt', '/');
    this.userService.deleteUser();
    this.router.navigate(['login']);
  }

  resetPass(){
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      minHeight: '350px',
      data: this.userService.getUser()
    });
  }

  notiClick(){
    if (this.notificationsService.notifications.length===0) this.dialogService.showMsgDialog('There are no notifications to display.');
    else this.notificationsService.sideBarShowSub.next(!this.notificationsService.showNotificationSideBar);
  }
}
