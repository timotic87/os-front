import {Component, Inject, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserService} from "../../../../services/user.service";
import {DialogService} from "../../../../services/dialog.service";
import {RestService} from "../../../../services/rest.service";

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.css'
})
export class ChangePasswordDialogComponent implements OnInit{

  changePassForm: FormGroup;
  title = 'Change Password';

  constructor(@Inject(MAT_DIALOG_DATA) public user: any, private userService: UserService, private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
              private dialogService: DialogService, private rest: RestService) {
    if (user.id!==userService.getUser().id) {
      this.title = this.title+' '+user.fullName;
    }

  }

  ngOnInit(): void {
    this.changePassForm = new FormGroup({
      password: new FormControl(null, [Validators.required])
    });

  }

  resetPass(){
    if(this.changePassForm.valid){
      this.dialogService.showLoader()
      let data = this.changePassForm.value;
      data.userID = this.user.id;
      this.rest.resetUserPass(data).subscribe(res=>{
        this.dialogService.closeLoader()
        if(res.status===201){
          console.log(res)
          this.dialogRef.close(res.status);
        }
      })
    }else {
      this.dialogService.closeLoader()
      this.dialogService.showMsgDialog("Please fill in all the blanks!");
    }
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
