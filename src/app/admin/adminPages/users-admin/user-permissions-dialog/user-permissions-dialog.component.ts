import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {log} from "@angular-devkit/build-angular/src/builders/ssr-dev-server";

@Component({
  selector: 'app-user-permissions-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf
  ],
  templateUrl: './user-permissions-dialog.component.html',
  styleUrl: './user-permissions-dialog.component.css'
})
export class UserPermissionsDialogComponent implements OnInit {

  arrayOfArrays = [];

  form: FormGroup;

  constructor(private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public user: any, private rest: RestService, private dialogRef: MatDialogRef<UserPermissionsDialogComponent>, private dialogService: DialogService) {
    console.log(this.user.permissions)
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
      checkboxes: this.fb.array(this.user.permissions.map(item => this.fb.control(item.userId !== null))) // Inicijalizacija za svaki checkbox
    });

  }

  get checkboxes() {
    return this.form.get('checkboxes') as FormArray;
  }

  ngOnInit(): void {

    }

  onSubmit(): void {
    this.dialogService.showLoader();
    this.rest.changeUserPermissions(this.user.permissions).subscribe(res=>{
      this.dialogService.closeLoader();
      console.log(res)
    })
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onChange(perm){
    if(perm.userId===this.user.id){
      perm.userId = null;

    }else {
      perm.userId=this.user.id;
    }
  }
}
