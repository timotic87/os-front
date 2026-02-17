import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {ButtonComponent} from '../../../../shared/components/ui/button/button.component';
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-user-permissions-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf,
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

  form: FormGroup;

  constructor(private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public user: any, private rest: RestService, private dialogRef: MatDialogRef<UserPermissionsDialogComponent>, private dialogService: DialogService) {
    this.initPermissions();
  }

  private initPermissions() {
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
        this.dialogService.showSnackBar('Permissions updated successfully!', '', 3000);
        this.dialogRef.close(true);
      }
    });
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
