import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserModel } from '../../../models/userModel';
import { RestService } from '../../../services/rest.service';
import { UsersService } from '../../../services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { DialogService } from '../../../services/dialog.service';
import { EditUserComponent } from './edit-user/edit-user.component';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { UserPermissionsDialogComponent } from './user-permissions-dialog/user-permissions-dialog.component';

// ShadCN UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../../shared/components/ui/card/card.component';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    BadgeComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent
  ],
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.css'
})
export class UsersAdminComponent {

  searchText: string = '';
  userList: UserModel[] = [];
  filteredUserList: UserModel[] = [];

  constructor(private rest: RestService, private usersService: UsersService, private dialog: MatDialog, private dialogService: DialogService) {
    this.updateUsers();
  }

  addUser() {
    this.dialog.open(CreateUserDialogComponent, {
      width: '800px',
      minHeight: '600px'
    }).afterClosed().subscribe(status => {
      if (status == 200) {
        this.updateUsers();
      }
    });
  }

  searchEvent(event: Event) {
    // @ts-ignore
    if (event.key === 'Enter') {
      this.search();
    }
  }

  search() {
    if (!this.searchText || this.searchText.trim().length === 0) {
      this.filteredUserList = [...this.userList];
      return;
    }
    const s = this.searchText.trim().toLowerCase();
    this.filteredUserList = this.userList.filter(user =>
      user.fullName?.toLowerCase().includes(s) ||
      user.userName?.toLowerCase().includes(s) ||
      user.department?.name?.toLowerCase().includes(s) ||
      user.unit?.name?.toLowerCase().includes(s) ||
      user.position?.name?.toLowerCase().includes(s)
    );
  }

  onSearchInput() {
    this.search();
  }

  clearSearch() {
    this.searchText = '';
    this.filteredUserList = [...this.userList];
  }

  updateUsers() {
    this.rest.getUsers().subscribe(res => {
      if (res.status == 200) {
        this.userList = this.usersService.getListOfUsers(res.data);
        this.filteredUserList = [...this.userList];
      }
    });
  }

  changeStatus(user) {
    this.dialogService.showChooseDialog('Are you sure you want to change this user\'s status?').afterClosed().subscribe(isYes => {
      if (isYes) {
        this.dialogService.showLoader();
        this.rest.changeUserStatus({ active: user.status.id, userId: user.id }).subscribe(res => {
          this.dialogService.closeLoader();
          if (res.status === 201) {
            this.updateUsers();
            this.dialogService.showSnackBar('User status changed successfully!', '', 3000);
          }
        });
      }
    });
  }

  editUser(user) {
    this.dialog.open(EditUserComponent, {
      width: '800px',
      minHeight: '600px',
      data: user
    }).afterClosed().subscribe(status => {
      if (status === 201) {
        this.updateUsers();
        this.dialogService.showSnackBar('User updated successfully!', '', 3000);
      }
    });
  }

  changePassword(user) {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      minHeight: '350px',
      data: user
    }).afterClosed().subscribe(status => {
      if (status === 201) {
        this.dialogService.showSnackBar('Password changed successfully!', '', 3000);
      }
    });
  }

  userPermissions(user) {
    this.rest.getUserPermissions(user.id).subscribe(res => {
      if (res.status === 200) {
        user.permissions = res.data;
        this.dialog.open(UserPermissionsDialogComponent, {
          width: '70vw',
          maxHeight: '90vh',
          data: user
        });
      }
    });
  }

  getStatusVariant(statusName: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    if (statusName?.toLowerCase() === 'active') return 'success';
    return 'destructive';
  }
}
