import { Injectable } from '@angular/core';
import {UserModel} from "../models/userModel";
import {CookieService} from "ngx-cookie-service";
import {JwtDecoderService} from "./jwt-decoder.service";
import {firstValueFrom, Subject} from "rxjs";
import {RestService} from "./rest.service";
import {DialogService} from "./dialog.service";
import {NotificationSocketService} from "./notification-socket.service";


@Injectable({
  providedIn: 'root'
})
export class UserService {

  isUserLogedIn = new Subject<boolean>();
  user: UserModel;
  permissions: any;
  entityAccessTypes: string[] = [];

  constructor(private cookieService: CookieService, private jwtDecoderService: JwtDecoderService, private rest: RestService,
              private dialogService: DialogService, private notificationSocketService: NotificationSocketService) { }

  public getUser(){
    const objStr = localStorage.getItem('user');
    return objStr ? UserModel.createUserFromLocalStorage(JSON.parse(objStr)) : null;
  }

  public getPermissions() {
    const objStr = localStorage.getItem('permissions');
    return objStr ? JSON.parse(objStr) : null;
  }

  public getEntityAccessTypes(): string[] {
    const stored = localStorage.getItem('entityAccessTypes');
    return stored ? JSON.parse(stored) : [];
  }

  public hasAnyEntityAccess(entityType: string): boolean {
    return this.getEntityAccessTypes().includes(entityType);
  }

  public setUser(){
    if (!this.cookieService.get('jwt')) return this.user=null;
    const decoded = this.jwtDecoderService.decodeToken(this.cookieService.get('jwt'));
    this.permissions = decoded.permissions;
    this.entityAccessTypes = decoded.entityAccessTypes || [];
    this.user = UserModel.createUserModel(decoded.user);

    localStorage.setItem('user', JSON.stringify(this.user));
    localStorage.setItem('permissions', JSON.stringify(this.permissions));
    localStorage.setItem('entityAccessTypes', JSON.stringify(this.entityAccessTypes));

    // Reset socket connection with new user data
    this.notificationSocketService.resetConnection();

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
    // Disconnect socket before clearing user data
    this.notificationSocketService.disconnectSocket();

    this.user = null;
    this.permissions = null;
    this.entityAccessTypes = [];
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('entityAccessTypes');
  }

  public can(permissionName: string): boolean {
    return this.getPermissions()?.includes(permissionName) ?? false;
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
