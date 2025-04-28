import {Component, Input, OnInit, Output} from '@angular/core';
import {ApprovalStepModel} from "../../../models/approval/ApprovalStepModel";
import {DialogService} from "../../../services/dialog.service";
import {DatePipe, NgIf} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {ApproveDialogComponent} from "../approve-dialog/approve-dialog.component";
import {ApprovalStatus} from "../../../models/approval/approvalStatus";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {UserService} from "../../../services/user.service";
import {PreviewStepCardDialogComponent} from "./preview-step-card-dialog/preview-step-card-dialog.component";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-approval-step-card',
  standalone: true,
  imports: [
    DatePipe,
    NgIf
  ],
  templateUrl: './approval-step-card.component.html',
  styleUrl: './approval-step-card.component.css'
})
export class ApprovalStepCardComponent implements OnInit{

  @Input() approval;
  @Input() stepIndex: number;

  approvalSteps;
  approvalStep

  constructor(private matDialog: MatDialog, private dialogService: DialogService, private userService: UserService, private route: ActivatedRoute) {
    // this.projectID = +this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.approvalSteps = this.approval.steps
    this.approvalStep = this.approvalSteps[this.stepIndex]

  }

  onStepClick(){
      switch (this.approvalStep.statusID) {
        case 1:
          if (this.userService.getUser().id === this.approvalStep.user.id) {
            if ((!this.approval.isSequential) || (this.stepIndex===0 || this.approvalSteps[this.stepIndex-1].statusID===2)){
              this.startApproving();
            }else {
              this.dialogService.showSnackBar('Is not Your turn.', '', 2500);
            }
          }else {
            this.dialogService.showSnackBar("This approval step is for another user!", '', 2500);
          }
          break;
        case 2:
        case 3:
          if(this.approvalStep.comment){
            this.matDialog.open(PreviewStepCardDialogComponent, {
              width: '30vw',
              maxHeight: '50vh',
              data: this.approvalStep
            })
          } else this.dialogService.showSnackBar('There is not comment.', '', 2500);
          break;
      }
  }


  startApproving(): void {

        this.matDialog.open(ApproveDialogComponent, {
          width: '50vw',
          maxHeight: '60vh',
          data: {approvalStep: this.approvalStep, nextApprovalStep: this.approvalSteps.length!==this.stepIndex? this.approvalSteps[this.stepIndex+1]:null}
        }).afterClosed().subscribe(result => {
          if (result.status === 200) {
            this.approvalStep = result.approvalStep;
          }

        });
      }

}
