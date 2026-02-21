import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import { CommonModule } from '@angular/common';
import {RestService} from "../services/rest.service";
import {CookieService} from "ngx-cookie-service";
import {Router, ActivatedRoute} from "@angular/router";
import {TokenService} from "../services/token.service";
import {UserService} from "../services/user.service";
import { NotificationSocketService } from '../services/notification-socket.service';
import {DialogService} from "../services/dialog.service";
import {NotificationStoreService} from "../services/notification-store-service.service";
import {ThemeService} from "../services/theme.service";
import { InputComponent } from '../shared/components/ui/input/input.component';
import { ButtonComponent } from '../shared/components/ui/button/button.component';
import { AlertComponent, AlertDescriptionComponent } from '../shared/components/ui/alert/alert.component';


@Component({
  selector: 'app-login',
  providers: [ CookieService ],
  standalone: true,
  imports: [ ReactiveFormsModule, CommonModule, InputComponent, ButtonComponent, AlertComponent, AlertDescriptionComponent ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  loginError: string = '';
  isLoading: boolean = false;
  private returnUrl: string;

  constructor(
    private rest: RestService,
    private router: Router,
    private route: ActivatedRoute,
    private tokenService: TokenService,
    private cookieService: CookieService,
    private userService: UserService,
    private notificationSocketService: NotificationSocketService,
    private dialogService: DialogService,
    private notificationStoreService: NotificationStoreService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Get return URL from route parameters or default to user's default page
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
    
    this.loginForm = new FormGroup({
      username: new FormControl(null, [Validators.required]),
      password: new FormControl(null, Validators.required)
    });

    // If user is already logged in
    if (this.tokenService.isTokenExist() && !this.tokenService.isTokenExp()) {
      this.userService.setUser();
      this.notificationSocketService.connectSocket();

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

      // Navigate to return URL or default page
      const redirectUrl = this.returnUrl || `/${this.userService.getUser().defpage}`;
      this.router.navigateByUrl(redirectUrl);
    }
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    this.rest.login({
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    }).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.status === 200) {
          const expiresDate: Date = new Date(Date.now() + 24 * 60 * 60 * 1000);
          this.cookieService.set('jwt', res.token, { expires: expiresDate, path: '/' });

          this.userService.setUser();
          this.userService.isUserLogedIn.next(true);
          this.notificationSocketService.connectSocket();

          this.rest.getNotifications().subscribe({
            next: res => {
              if (res.status == 200) {
                res.data.forEach((item) => {
                  this.notificationStoreService.addNotification(item);
                })
              }
            },
            error: err => console.log(err)
          })

          // Navigate to return URL or user's default page
          const redirectUrl = this.returnUrl || this.userService.getUser().defpage;
          this.router.navigateByUrl(redirectUrl);
        } else {
          this.loginError = res.msg || 'Invalid login credentials';
        }
      },
      error: err => {
        this.isLoading = false;
        this.loginError = 'Error connecting to the server. Please try again.';
        console.error('Login error:', err);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return fieldName === 'username' ? 'Username is required' : 'Password is required';
      }
    }
    return '';
  }

}
