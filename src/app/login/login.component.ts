import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RestService} from "../services/rest.service";
import {CookieService} from "ngx-cookie-service";
import {Router} from "@angular/router";
import {TokenService} from "../services/token.service";
import {UserService} from "../services/user.service";

@Component({
  selector: 'app-login',
  providers: [
    CookieService
  ],
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{


  loginForm: FormGroup;
  constructor(private rest: RestService, private router: Router, tokenService: TokenService, private cookieService: CookieService, private userService: UserService,) {
    if (tokenService.isTokenExist() && !tokenService.isTokenExp()){

        router.navigate([`/${userService.getUser().defpage}`]);
    }
  }

  ngOnInit() {
    this.loginForm = new FormGroup({
      username: new FormControl(null, [Validators.required]),
      password: new FormControl(null, Validators.required)
    })
  }

  login(){
    this.rest.login({username: this.loginForm.value.username, password: this.loginForm.value.password}).subscribe(res=>{
      if(res.status === 200){
        const expiresDate: Date = new Date(Date.now()+24*60*60*1000);
        this.cookieService.set('jwt', res.token, { expires: expiresDate, path: '/' });
        this.userService.setUser();
        this.userService.isUserLogedIn.next(true);
        this.router.navigate([this.userService.getUser().defpage])
      }else {
        console.log(res.status, res.msg)
      }
    })
  }

}
