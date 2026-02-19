import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";
import {UserService} from "../../../../services/user.service";
import {CookieService} from "ngx-cookie-service";
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {ButtonComponent} from '../../../../shared/components/ui/button/button.component';
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-user-permissions-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf,
    NgIf,
    ButtonComponent,
    FormsModule
  ],
  templateUrl: './user-permissions-dialog.component.html',
  styleUrl: './user-permissions-dialog.component.css'
})
export class UserPermissionsDialogComponent implements OnInit {

  arrayOfArrays = [];
  templates: any[] = [];
  selectedTemplateId: number | null = null;

  // Entity Access
  entityAccesses: any[] = [];
  newAccess = { entityType: 'deal', entityId: null as number | null, accessLevel: 'view' };
  entityTypes = ['deal', 'recruiting_order', 'client'];
  accessLevels = ['view', 'edit'];

  form: FormGroup;

  constructor(private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public user: any, private rest: RestService, private dialogRef: MatDialogRef<UserPermissionsDialogComponent>, private dialogService: DialogService, private userService: UserService, private cookieService: CookieService) {
    this.initPermissions();
  }

  private initPermissions() {
    // Assign flat index to each permission so the template can bind to the correct FormArray control
    this.user.permissions.forEach((p, i) => p._index = i);

    // @ts-ignore
    const groupedBySection = this.user.permissions.reduce<Record<number, any[]>>((acc, item) => {
      if (!acc[item.sectionID]) {
        acc[item.sectionID] = [];
      }
      acc[item.sectionID].push(item);
      return acc;
    }, {});
    this.arrayOfArrays = Object.values(groupedBySection);

    this.form = this.fb.group({
      checkboxes: this.fb.array(this.user.permissions.map(item => this.fb.control(item.userId !== null)))
    });
  }

  get checkboxes() {
    return this.form.get('checkboxes') as FormArray;
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.loadEntityAccesses();
  }

  loadEntityAccesses() {
    this.rest.getUserEntityAccesses(this.user.id).subscribe(res => {
      if (res.status === 200) {
        this.entityAccesses = res.data;
      }
    });
  }

  grantAccess() {
    if (!this.newAccess.entityId) return;
    this.rest.grantEntityAccess({
      userId: this.user.id,
      entityType: this.newAccess.entityType,
      entityId: this.newAccess.entityId,
      accessLevel: this.newAccess.accessLevel
    }).subscribe({
      next: res => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Entity access granted!', '', 3000);
          this.loadEntityAccesses();
          this.newAccess.entityId = null;
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }

  revokeAccess(access: any) {
    this.rest.revokeEntityAccess({
      userId: this.user.id,
      entityType: access.entityType,
      entityId: access.entityId
    }).subscribe({
      next: res => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Entity access revoked!', '', 3000);
          this.loadEntityAccesses();
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }

  loadTemplates() {
    this.rest.getPermissionTemplates().subscribe(res => {
      if (res.status === 200) {
        this.templates = res.data;
      }
    });
  }

  applyTemplate() {
    if (!this.selectedTemplateId) return;

    this.dialogService.showChooseDialog('This will replace ALL existing permissions for this user. Continue?')
      .afterClosed().subscribe(isYes => {
        if (isYes) {
          this.dialogService.showLoader();
          this.rest.applyPermissionTemplate(this.selectedTemplateId, this.user.id).subscribe({
            next: res => {
              if (res.status === 200) {
                // Reload permissions to refresh the checkboxes
                this.rest.getUserPermissions(this.user.id).subscribe(permRes => {
                  this.dialogService.closeLoader();
                  if (permRes.status === 200) {
                    this.user.permissions = permRes.data;
                    this.initPermissions();
                    this.refreshCurrentUserToken();
                    this.dialogService.showSnackBar('Template applied successfully!', '', 3000);
                  }
                });
              }
            },
            error: err => {
              this.dialogService.closeLoader();
              this.dialogService.errorServDialog(err);
            }
          });
        }
      });
  }

  onSubmit(): void {
    this.dialogService.showLoader();
    this.rest.changeUserPermissions(this.user.permissions).subscribe(res => {
      this.dialogService.closeLoader();
      if (res.status === 200 || res.status === 201) {
        this.refreshCurrentUserToken();
        this.dialogService.showSnackBar('Permissions updated successfully!', '', 3000);
        this.dialogRef.close(true);
      }
    });
  }

  private refreshCurrentUserToken() {
    const currentUser = this.userService.getUser();
    if (currentUser && currentUser.id === this.user.id) {
      this.rest.refreshToken().subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.token) {
            this.cookieService.set('jwt', res.token, { path: '/' });
            this.userService.setUser();
          }
        }
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onChange(perm) {
    if (perm.userId === this.user.id) {
      perm.userId = null;
    } else {
      perm.userId = this.user.id;
    }
  }
}
