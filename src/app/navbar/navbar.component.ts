import {Component, OnDestroy} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {UserService} from "../services/user.service";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {MatDividerModule} from "@angular/material/divider";
import {CookieService} from "ngx-cookie-service";
import {Subscription} from "rxjs";
import {MatDialog} from "@angular/material/dialog";
import {ChangePasswordDialogComponent} from "../admin/adminPages/users-admin/change-password-dialog/change-password-dialog.component";
import {SalaryCalculatorDialogComponent} from "../utils-dialogs/salary-calculator-dialog.component";
import {NbsRateDialogComponent} from "../utils-dialogs/nbs-rate-dialog.component";
import {NgIf} from "@angular/common";
import {NotificationStoreService} from "../services/notification-store-service.service";
import {NotificationSocketService} from "../services/notification-socket.service";
import {ThemeToggleComponent} from '../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatDividerModule,
    RouterLinkActive,
    RouterLink,
    NgIf,
    ThemeToggleComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnDestroy {

  unreadCount = 0;
  private unreadSub: Subscription;

  constructor(
    public userService: UserService,
    private cookieService: CookieService,
    private router: Router,
    private dialog: MatDialog,
    private notificationStoreService: NotificationStoreService,
    private notificationSocketService: NotificationSocketService
  ) {
    this.unreadSub = this.notificationStoreService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy() {
    this.unreadSub.unsubscribe();
  }

  logout() {
    this.notificationSocketService.disconnectSocket();
    this.cookieService.delete('jwt', '/');
    this.userService.deleteUser();
    this.notificationStoreService.toggleNotificationBar.next(false);
    this.router.navigate(['login']);
  }

  resetPass() {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      minHeight: '350px',
      data: this.userService.getUser()
    });
  }

  notiClick() {
    this.notificationStoreService.toggleValue = !this.notificationStoreService.toggleValue;
    this.notificationStoreService.toggleNotificationBar.next(this.notificationStoreService.toggleValue);
  }

  openSalaryCalculator() {
    this.dialog.open(SalaryCalculatorDialogComponent, {
      width: '800px',
      maxHeight: '90vh'
    });
  }

  openNbsRate() {
    this.dialog.open(NbsRateDialogComponent, {
      width: '550px',
      maxHeight: '90vh'
    });
  }
}
