import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApprovalStepModel} from "../../../models/approval/ApprovalStepModel";
import {DialogService} from "../../../services/dialog.service";
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {ApproveDialogComponent} from "../approve-dialog/approve-dialog.component";
import {ApprovalStatus} from "../../../models/approval/approvalStatus";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {UserService} from "../../../services/user.service";
import {PreviewStepCardDialogComponent} from "./preview-step-card-dialog/preview-step-card-dialog.component";
import {ActivatedRoute} from "@angular/router";
import {DocumentService} from "../../../services/document.service";

@Component({
  selector: 'app-approval-step-card',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    NgClass
  ],
  templateUrl: './approval-step-card.component.html',
  styleUrl: './approval-step-card.component.css'
})
export class ApprovalStepCardComponent implements OnInit{

  @Input() approval;
  @Input() stepIndex: number;
  @Output() approvalChanged = new EventEmitter<any>();
  @Output() approvalCompleted = new EventEmitter<any>();

  approvalSteps;
  approvalStep

  constructor(private matDialog: MatDialog, private dialogService: DialogService, private userService: UserService, private route: ActivatedRoute, private documentService: DocumentService) {
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
          width: '480px',
          maxWidth: '90vw',
          autoFocus: false,
          hasBackdrop: false, // Remove backdrop completely to prevent overlay issues
          disableClose: false,
          panelClass: ['approve-dialog-panel-no-backdrop'],
          data: {approvalStep: this.approvalStep, nextApprovalStep: this.approvalSteps.length!==this.stepIndex? this.approvalSteps[this.stepIndex+1]:null}
        }).afterClosed().subscribe(result => {
          if (result && result.status === 200) {
            // Update the current step
            this.approvalStep = result.approvalStep;
            
            // Update the approval steps array to reflect changes
            this.approvalSteps[this.stepIndex] = result.approvalStep;
            
            // If all approvals are completed, emit completion BEFORE change event
            // (approvalChanged triggers cdr.detectChanges in parent which can destroy this component)
            if (result.allApproved) {
              let extractedDealId = result.fullData?.dealId || this.approval.dealId || this.approval.deal?.ID ||
                                   this.approval.document?.dealId || result.fullData?.deal?.ID;

              if (!extractedDealId) {
                const dealIdFromUrl = +this.route.snapshot.paramMap.get('id');
                if (dealIdFromUrl) {
                  extractedDealId = dealIdFromUrl;
                }
              }

              // Emit local event to parent component
              this.approvalCompleted.emit({
                approvalId: this.approval.ID,
                allSteps: this.approvalSteps,
                fullData: result.fullData
              });

              // Emit global event through DocumentService for all listeners
              this.documentService.approvalCompleted.next({
                approvalId: this.approval.ID,
                documentId: result.fullData?.documentId || this.approval.documentId,
                dealId: extractedDealId,
                allApproved: result.allApproved,
                allSteps: this.approvalSteps,
                fullData: result.fullData
              });
            }

            // Emit the change event to notify parent components
            this.approvalChanged.emit({
              stepIndex: this.stepIndex,
              approvalStep: result.approvalStep,
              allSteps: this.approvalSteps,
              fullData: result.fullData
            });
            
            // Emit document status update event to trigger document refresh for any status change
            if (result.approvalStep.statusID === 2 || result.approvalStep.statusID === 3) {
              // Emit event for both approved and declined to trigger document refresh
              if (result.approvalStep.statusID === 3) {
                // Specifically for rejection
                this.documentService.approvalRejected.next({
                  approvalId: this.approval.ID,
                  documentId: result.fullData?.documentId || this.approval.documentId,
                  dealId: result.fullData?.dealId || this.approval.dealId,
                  fullData: result.fullData
                });
              }
              
              // For both approved and rejected - trigger document list refresh
              this.documentService.documentSubmitted.next({
                approvalId: this.approval.ID,
                documentId: result.fullData?.documentId || this.approval.documentId,
                dealId: result.fullData?.dealId || this.approval.dealId,
                statusID: result.approvalStep.statusID,
                allApproved: result.allApproved,
                fullData: result.fullData
              });
            }
            
            // Show success message
            const statusText = result.approvalStep.statusID === 2 ? 'approved' : 
                             result.approvalStep.statusID === 3 ? 'declined' : 'updated';
            this.dialogService.showSnackBar(`Step ${statusText} successfully!`, '', 3000);
            
          } else if (result && result.error) {
            this.dialogService.showSnackBar('Something went wrong. Please try again.', '', 3000);
          }
        });
      }

  getStatusBorderClass(): string {
    if (!this.approvalStep?.statusID) {
      return 'border-l-gray-400';
    }

    switch (this.approvalStep.statusID) {
      case 1: // Pending
        return 'border-l-amber-500 dark:border-l-amber-400';
      case 2: // Approved
        return 'border-l-green-500 dark:border-l-green-400';
      case 3: // Declined
        return 'border-l-red-500 dark:border-l-red-400';
      case 4: // Cancelled
        return 'border-l-gray-500 dark:border-l-gray-400';
      default:
        return 'border-l-gray-400';
    }
  }

  getStatusDotClass(): string {
    if (!this.approvalStep?.statusID) {
      return 'bg-gray-400';
    }

    switch (this.approvalStep.statusID) {
      case 1: // Pending
        return 'bg-amber-500 animate-pulse';
      case 2: // Approved
        return 'bg-green-500';
      case 3: // Declined
        return 'bg-red-500';
      case 4: // Cancelled
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusText(): string {
    if (!this.approvalStep?.statusID) {
      return 'Unknown';
    }

    switch (this.approvalStep.statusID) {
      case 1:
        return 'Pending approval';
      case 2:
        return 'Approved';
      case 3:
        return 'Declined';
      case 4:
        return 'Cancelled';
      default:
        return 'Unknown status';
    }
  }

  canInteract(): boolean {
    return this.approvalStep?.statusID === 1 && 
           this.userService.getUser().id === this.approvalStep.user.id;
  }

  getActionHint(): string {
    if (this.approvalStep?.statusID === 1) {
      if (this.userService.getUser().id === this.approvalStep.user.id) {
        return 'Click to approve';
      } else {
        return 'Waiting for approval';
      }
    }
    
    if (this.approvalStep?.comment && (this.approvalStep.statusID === 2 || this.approvalStep.statusID === 3)) {
      return 'Click to view comment';
    }
    
    return '';
  }

}
