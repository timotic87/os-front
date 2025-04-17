import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {log} from "@angular-devkit/build-angular/src/builders/ssr-dev-server";

@Component({
  selector: 'app-user-permisions-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgForOf
  ],
  templateUrl: './user-permisions-dialog.component.html',
  styleUrl: './user-permisions-dialog.component.css'
})
export class UserPermisionsDialogComponent implements OnInit {

  arrayOfArrays = [];

  form: FormGroup;

  constructor(private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public user: any, private rest: RestService, private dialogRef: MatDialogRef<UserPermisionsDialogComponent>, private dialogService: DialogService) {
    // console.log(this.user.permisions)
    // @ts-ignore
    const groupedBySection = this.user.permisions.reduce<Record<number, any[]>>((acc, item) => {
      if (!acc[item.sectionID]) {
        acc[item.sectionID] = [];
      }
      acc[item.sectionID].push(item);
      return acc;
    }, {});
    this.arrayOfArrays = Object.values(groupedBySection);


    this.form = this.fb.group({
      checkboxes: this.fb.array(this.user.permisions.map(item => this.fb.control(item.userId !== null))) // Inicijalizacija za svaki checkbox
    });
  }

  get checkboxes() {
    return this.form.get('checkboxes') as FormArray;
  }

  ngOnInit(): void {
    console.log(this.checkboxes)
    }

  onSubmit(): void {
    this.dialogService.showLoader();
    console.log(this.user.permisions)
    this.rest.changeUserPermisions(this.user.permisions).subscribe(res=>{
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
