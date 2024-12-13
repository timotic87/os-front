import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {UserModel} from "../../../models/userModel";
import {RestService} from "../../../services/rest.service";
import {UsersService} from "../../../services/users.service";
import {MatDialog} from "@angular/material/dialog";
import {CreateUserDialogComponent} from "./create-user-dialog/create-user-dialog.component";
import {DialogService} from "../../../services/dialog.service";
import {EditUserComponent} from "./edit-user/edit-user.component";
import {ChangePasswordDialogComponent} from "./change-password-dialog/change-password-dialog.component";
import {UserPermisionsDialogComponent} from "./user-permisions-dialog/user-permisions-dialog.component";
@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.css'
})
export class UsersAdminComponent {

  searchText: string = null;
  userList: UserModel[] = []

  constructor(private rest: RestService, private usersService: UsersService, private dialog: MatDialog, private dialogService: DialogService) {
    this.updateUsers();
  }

  addUser(){
    this.dialog.open(CreateUserDialogComponent, {
      width: '800px',
      minHeight: '600px'
    }).afterClosed().subscribe(status=>{
      if(status==200){
        this.updateUsers();
      }
    })
  }

  searchEvent(event: Event){
    // @ts-ignore
    if (event.key==='Enter'){
      this.search();
    }
  }

  search(){
    //todo search users
    this.dialogService.showLoader()
  }

  updateUsers(){
    this.rest.getUsers().subscribe(res=>{
      if(res.status == 200){
        this.userList = this.usersService.getListOfUsers(res.data);
      }
    });
  }

  changeStatus(user){
    this.dialogService.showChooseDialog('Are You sure You want change user status?').afterClosed().subscribe(isYes=>{
      if(isYes){
        this.dialogService.showLoader()
        this.rest.changeUserStatus({active: user.status.id, userId: user.id}).subscribe(res=>{
          this.dialogService.closseLoader()
          if (res.status===201){
            this.updateUsers();
            //todo prevod
            this.dialogService.showSnackBar('Uspesno ste promenili status!', '', 3000);
          }
        });
      }
    })
  }

  editUser(user){
    this.dialog.open(EditUserComponent, {
      width: '800px',
      minHeight: '600px',
      data: user
    }).afterClosed().subscribe(status=>{
      if(status===201){
        this.updateUsers();
        //TODO prevod
        this.dialogService.showSnackBar('Uspesno ste edit usera!', '', 3000);
        return;
      }

    });
  }

  changePassword(user){
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      minHeight: '350px',
      data: user
    }).afterClosed().subscribe(status=>{
      if(status===201){
        this.dialogService.showSnackBar('Uspesno ste promenili sifru', "", 3000);
      }
    });
  }

  userPermisions(user){
      this.rest.getUserPermisions(user.id).subscribe(res=>{
        if (res.status===200){
          user.permisions = res.data;
          this.dialog.open(UserPermisionsDialogComponent, {
            width: '800px',
            minHeight: '600px',
            data: user
          })
        }
      });
  }

}
