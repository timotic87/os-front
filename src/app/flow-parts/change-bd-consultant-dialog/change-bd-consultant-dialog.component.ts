import {Component, Inject, OnInit} from '@angular/core';
import {UsersService} from "../../services/users.service";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgIf} from "@angular/common";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DialogService} from "../../services/dialog.service";
import {RestService} from "../../services/rest.service";

@Component({
  selector: 'app-change-bd-consultant-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    ReactiveFormsModule
  ],
  templateUrl: './change-bd-consultant-dialog.component.html',
  styleUrl: './change-bd-consultant-dialog.component.css'
})
export class ChangeBdConsultantDialogComponent implements OnInit {

  bdValue = '';
  bdList;

  sellectedBD;

  constructor(public allUsersService: UsersService, private dialogRef: MatDialogRef<ChangeBdConsultantDialogComponent>, private dialogService: DialogService,
              private rest: RestService,@Inject(MAT_DIALOG_DATA) public dealID: any) {
    allUsersService.getUsersByPermission(4);
  }

  ngOnInit(): void {
  }

  onBdChange(event) {
    if(event.length > 0) {
      this.bdList = this.bdList.filter(bd=>bd.fullName.toLowerCase().includes(event.toLowerCase()));
      return;
    }
    this.bdList = this.allUsersService.usersListByPermision;
  }

  onInputClick(){
    if(this.bdValue.length > 0) {
      this.bdList = this.bdList.filter(bd=>bd.fullName.toLowerCase().includes(this.bdValue.toLowerCase()));
      return;
    }
    this.bdList = this.allUsersService.usersListByPermision;
  }

  onBdClick(bd) {
    this.sellectedBD = bd;
  }

  changeBD() {
    this.dialogService.showChooseDialog("Are you sure you want to change the BD consultant?").afterClosed().subscribe(result => {
      if (result) {
        this.dialogService.showLoader();
        this.rest.changeBD({dealID: this.dealID, newBDUserID:this.sellectedBD.id}).subscribe({
          next: () => {
            this.dialogService.closeLoader();
            this.dialogRef.close(true);
          },
          error: err => {
            this.dialogService.closeLoader();
            this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
          }
        })
      }
    })
  }

  closeDialog(){
    this.dialogRef.close();
  }

}
