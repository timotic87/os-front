import { Component } from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {UserService} from "../services/user.service";
import {MatMenu, MatMenuItem, MatMenuTrigger,} from "@angular/material/menu";
import {MatIconModule} from '@angular/material/icon';
import {CookieService} from "ngx-cookie-service";
import {MatDialog} from "@angular/material/dialog";
import {
  ChangePasswordDialogComponent
} from "../admin/adminPages/users-admin/change-password-dialog/change-password-dialog.component";
import {NgIf} from "@angular/common";
import {NotificationStoreService} from "../services/notification-store-service.service";
import {DialogService} from "../services/dialog.service";

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
  notificationList = []

  constructor(public userService: UserService, private cookieService: CookieService, private router: Router, private dialog: MatDialog,
              private notificationStoreService: NotificationStoreService, private dialogService: DialogService) {
    this.notificationStoreService.notifications$.subscribe(list => {
      this.notificationList = list;
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
    if (this.notificationList.length===0) this.dialogService.showMsgDialog('There are no notifications to display.');
    else {
      this.notificationStoreService.toggleValue = !this.notificationStoreService.toggleValue;
      this.notificationStoreService.toggleNotificationBar.next(this.notificationStoreService.toggleValue);
    }
  }
}
