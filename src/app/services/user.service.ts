import { Injectable } from '@angular/core';
import {UserModel} from "../models/userModel";
import {CookieService} from "ngx-cookie-service";
import {JwtDecoderService} from "./jwt-decoder.service";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  isUserLogedIn = new Subject<boolean>();
  user: UserModel;
  private _socketID = '';

  constructor(private cookieService: CookieService, private jwtDecoderService: JwtDecoderService) { }

  public getUser(){
    const objStr = localStorage.getItem('user');
    return objStr ? UserModel.createUserFromLocalStorage(JSON.parse(objStr)) : null;
  }

  public setUser(){
    if (!this.cookieService.get('jwt')) return this.user=null;
    this.user = UserModel.createUserModel(this.jwtDecoderService.decodeToken(this.cookieService.get('jwt')).user);
    localStorage.setItem('user', JSON.stringify(this.user));
    return
  }

  public updatePicUrl(url:string){
    if (!this.user){
      this.user = UserModel.createUserFromLocalStorage(JSON.parse(localStorage.getItem('user')))
    }
    this.user.picUrl = url;
    localStorage.setItem('user', JSON.stringify(this.user));
  }

  public deleteUser(){
    this.user = null;
    localStorage.removeItem('user');
  }


  get socketID(): string {
    return this._socketID;
  }

  set socketID(value: string) {
    this._socketID = value;
  }
}
