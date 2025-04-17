import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {CDCM} from "../../../../models/cdcm";
import {RestService} from "../../../../services/rest.service";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter, Subject} from "rxjs";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {DialogService} from "../../../../services/dialog.service";
import {ApprovalService} from "../../../../services/approval.service";

@Component({
  selector: 'app-approval-view-edit-dialog',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgForOf
  ],
  templateUrl: './approval-view-edit-dialog.component.html',
  styleUrl: './approval-view-edit-dialog.component.css'
})
export class ApprovalViewEditDialogComponent implements OnInit {

  approvalEditInfo: FormGroup;

  currentUserList = [];
  currentUserChoosen;


  constructor(@Inject(MAT_DIALOG_DATA) public approval, private rest: RestService, private dialogService: DialogService, private approvalService: ApprovalService) {
  }

  ngOnInit(): void {
        this.approvalEditInfo = new FormGroup({
          approvalName: new FormControl(this.approval.name, [Validators.required]),
          isSequential: new FormControl(this.approval.isSequential, [Validators.required]),
          description: new FormControl(this.approval.description),
          userChooser: new FormControl(null)
        });

        this.approvalEditInfo.get('userChooser').valueChanges.subscribe(value => {
          this.rest.getUsersNamesBySearch(value).subscribe(res=>{
            if (res['status']===200) this.currentUserList = res['data'];
          })
        })
    }

  deleteStep(step){
    this.dialogService.showLoader()
    this.rest.deleteApprovalTemplateStep(step).subscribe(res=>{
      this.dialogService.closeLoader()
      if (res['status']===201){
        console.log(this.approval.approvalStep)
        this.approval.approvalStep = this.approval.approvalStep.filter(item=>item.ID!==step.ID)
      }
    });
  }

  editApprovalTemplate(){
    this.dialogService.showLoader();
    this.rest.editApprovalTemplate({...this.approvalEditInfo.value, ID: this.approval.ID}).subscribe(res=>{
      this.dialogService.closeLoader();
      if (res.status===201){
        this.approval.name = this.approvalEditInfo.get('approvalName').value
        this.dialogService.showSnackBar('Successfuly updated Approval Template!', '', 2500);
        this.approvalService.updateApprovalTemplteSubject.next({...this.approvalEditInfo.value, ID: this.approval.ID});
      }
    })
  }

  addStepTemplate(){
    this.dialogService.showLoader();
     let stepNumber = (!this.approval.approvalStep || this.approval.approvalStep.length===0)? 1:this.approval.approvalStep.length+1;
     this.rest.addApprovalStepTemplate({...this.currentUserChoosen, stepNumber, approvalTemplateID: this.approval.ID}).subscribe(res=>{
       this.dialogService.closeLoader();
       if (res['status']===201){
         if (!this.approval.approvalStep) this.approval.approvalStep = [];
         this.approval.approvalStep.push(res.data.row.recordset[0]);
       }
     })

  }

  onUserClick(user){
    this.currentUserChoosen = user;
  }

}
