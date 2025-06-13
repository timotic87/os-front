import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RestService} from "../services/rest.service";
import {CookieService} from "ngx-cookie-service";
import {Router} from "@angular/router";
import {TokenService} from "../services/token.service";
import {UserService} from "../services/user.service";
import { NotificationSocketService } from '../services/notification-socket.service';


@Component({
  selector: 'app-login',
  providers: [ CookieService ],
  standalone: true,
  imports: [ ReactiveFormsModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;

  constructor(
    private rest: RestService,
    private router: Router,
    private tokenService: TokenService,
    private cookieService: CookieService,
    private userService: UserService,
    private notificationSocketService: NotificationSocketService
  ) {}

  ngOnInit() {
    this.loginForm = new FormGroup({
      username: new FormControl(null, [Validators.required]),
      password: new FormControl(null, Validators.required)
    });

    // ✅ Ako je već ulogovan korisnik
    if (this.tokenService.isTokenExist() && !this.tokenService.isTokenExp()) {
      this.userService.setUser(); // ← Postavi user-a u memoriju
      this.notificationSocketService.connectSocket(); // ← Konektuj socket
      this.notificationServiceInit(); // ← Poveži listener
      this.router.navigate([`/${this.userService.getUser().defpage}`]);
    }
  }

  login() {
    this.rest.login({
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    }).subscribe(res => {
      if (res.status === 200) {
        const expiresDate: Date = new Date(Date.now() + 24 * 60 * 60 * 1000);
        this.cookieService.set('jwt', res.token, { expires: expiresDate, path: '/' });

        this.userService.setUser(); // Postavi user
        this.userService.isUserLogedIn.next(true);

        this.notificationSocketService.connectSocket(); // ← obavezno nakon setUser
        this.notificationServiceInit(); // ← veže listener na socket

        this.router.navigate([this.userService.getUser().defpage]);
      } else {
        console.log(res.status, res.msg);
      }
    });
  }

  notificationServiceInit() {
    this.notificationSocketService.listenForNotifications().subscribe((notification) => {
      console.log('📥 Primljena notifikacija:', notification);
      // TODO: ovde može toast ili dodavanje u listu
    });
  }
}
