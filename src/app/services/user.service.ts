import { Injectable } from '@angular/core';
import {UserModel} from "../models/userModel";
import {CookieService} from "ngx-cookie-service";
import {JwtDecoderService} from "./jwt-decoder.service";
import {firstValueFrom, Subject} from "rxjs";
import {RestService} from "./rest.service";
import {DialogService} from "./dialog.service";


@Injectable({
  providedIn: 'root'
})
export class UserService {

  isUserLogedIn = new Subject<boolean>();
  user: UserModel;
  permissions: any

  constructor(private cookieService: CookieService, private jwtDecoderService: JwtDecoderService, private rest: RestService,
              private dialogService: DialogService) { }

  public getUser(){
    const objStr = localStorage.getItem('user');
    return objStr ? UserModel.createUserFromLocalStorage(JSON.parse(objStr)) : null;
  }

  public getPermissions() {
    const objStr = localStorage.getItem('permissions');
    return objStr ? JSON.parse(objStr) : null;
  }

  public setUser(){
    if (!this.cookieService.get('jwt')) return this.user=null;
    this.permissions = this.jwtDecoderService.decodeToken(this.cookieService.get('jwt')).permissions
    this.user = UserModel.createUserModel(this.jwtDecoderService.decodeToken(this.cookieService.get('jwt')).user);

    localStorage.setItem('user', JSON.stringify(this.user));
    localStorage.setItem('permissions', JSON.stringify(this.permissions));
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
    this.permissions = null;
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  }

  public can(permissionName: string): boolean {
    return this.getPermissions().includes(permissionName);
  }
  async hasEntityAccess(entityType: string, entityId: number, requiredLevel?: 'view' | 'edit'): Promise<boolean> {
    return new Promise((resolve) => {
      this.rest.getEntityaccess({ entityType, entityId }).subscribe({
        next: res => {
          if (res.success && res.hasAccess?.hasAccess) {
            const actualLevel = res.hasAccess.accessLevel;

            if (!requiredLevel) {
              // Ako nije prosleđen nivo – bilo koji accessLevel je prihvatljiv
              resolve(true);
            } else {
              // Ako jeste prosleđen – mora da se poklopi
              resolve(actualLevel === requiredLevel);
            }

          } else {
            resolve(false);
          }
        },
        error: err => {
          this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
          resolve(false);
        }
      });
    });
  }


}
