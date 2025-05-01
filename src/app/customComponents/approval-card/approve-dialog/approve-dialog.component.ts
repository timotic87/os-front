import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../services/rest.service";
import {ApprovalStepModel} from "../../../models/approval/ApprovalStepModel";
import {DialogService} from "../../../services/dialog.service";

@Component({
  selector: 'app-approve-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf
  ],
  templateUrl: './approve-dialog.component.html',
  styleUrl: './approve-dialog.component.css'
})
export class ApproveDialogComponent implements OnInit {

  approveFormGroup: FormGroup

  showMandatoryText = false;

  approvalStep:any;
  nextStep: any;

  constructor(private dialogRef: MatDialogRef<ApproveDialogComponent>, private rest: RestService,
              @Inject(MAT_DIALOG_DATA) public approvalSteps: any) {
    this.approvalStep = approvalSteps.approvalStep
    this.nextStep = approvalSteps.nextApprovalStep
  }

  ngOnInit(): void {
    this.approveFormGroup =  new FormGroup({
      comment: new FormControl()
      });
    this.approveFormGroup.get('comment').valueChanges.subscribe(value => {
      if (value && value.length>0) {
        this.showMandatoryText = false
      }
    })

    }

  approve(): void {
    this.changeStatus(2);
  }

  decline(){
    this.changeStatus(3);
  }

  cancel(): void {
    this.dialogRef.close()
  }

  changeStatus(statusID: number){
    if ((statusID===3 || statusID===4) && !this.approveFormGroup.value.comment){
      this.showMandatoryText = true;
      return;
    }
    this.rest.changeStatusApprovalStep({statusID: statusID, approvalStepID: this.approvalStep.ID, comment: this.approveFormGroup.value.comment, approvalId: this.approvalStep.approvalID, nextStep: this.nextStep}).subscribe(res =>{
      if (res.status === 200) {
        this.dialogRef.close({status: res.status, approvalStep: res.data.approvalStep});
        if (statusID===3 || statusID===4 || res.data.allApproved){
          window.location.reload();
        }

      }else {
        this.dialogRef.close();
        alert("Something went wrong");
      }
    })
  }
}
