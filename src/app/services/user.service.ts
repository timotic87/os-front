import { Injectable } from '@angular/core';
import {UserModel} from "../models/userModel";
import {CookieService} from "ngx-cookie-service";
import {JwtDecoderService} from "./jwt-decoder.service";
import {firstValueFrom, Subject} from "rxjs";
import {RestService} from "./rest.service";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  isUserLogedIn = new Subject<boolean>();
  user: UserModel;
  private _socketID = '';

  constructor(private cookieService: CookieService, private jwtDecoderService: JwtDecoderService, private rest: RestService) { }

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

  // public checkPermision(permisionID:number):boolean{
  //   this.rest.getUserPermisions(this.getUser().id).subscribe(res => {
  //     if (res.status === 200) {
  //       let perm = res.data.find(permision => permision.id === permisionID);
  //       return perm.userId ? false : true;
  //     }
  //     return false;
  //   });
  // }

  // public async checkPermission(permisionID: number): Promise<boolean> {
  //   try {
  //     const res = await firstValueFrom(this.rest.getUserPermisions(this.getUser().id));
  //     if (res.status === 200) {
  //       const perm = res.data.find(p => p.id === permisionID);
  //       return !(perm?.userId); // ako ima userId → false
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error("Greška u checkPermission:", error);
  //     return false;
  //   }
  // }

  public checkPermission(permisionID: number, callback: (ok: boolean) => void): void {
    this.rest.getUserPermisions(this.getUser().id).subscribe(res => {
      if (res.status === 200) {
        const perm = res.data.find(p => p.id === permisionID);
        callback(!(perm?.userId));
      } else {
        callback(false);
      }
    }, error => {
      callback(false);
    });
  }
}
