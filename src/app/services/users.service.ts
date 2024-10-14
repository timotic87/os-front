import { Injectable } from '@angular/core';
import {UserModel} from "../models/userModel";
import {RestService} from "./rest.service";

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  usersListByPermision: UserModel[];

  constructor(private rest: RestService) { }

  getListOfUsers(data: any): any {
    let users: UserModel[] = [];
    for (let item of data) {
      let user = UserModel.createUserModel(item);
      users.push(user)
    }
    return users;
  }

  getUsersByPermision(permisionId): any {
    this.usersListByPermision = [];
    this.rest.getUsersByPermisionID(permisionId).subscribe(res=>{
      if (res.status === 200) {
        for (let item of res.data) {
          this.usersListByPermision.push(UserModel.createUserModel(item));
        }
      }
    })

  }


}
