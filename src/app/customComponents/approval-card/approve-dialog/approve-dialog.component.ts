import {Component, Inject, Input, OnInit, ViewEncapsulation, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgClass, NgIf, NgStyle} from "@angular/common";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../services/rest.service";
import {ApprovalStepModel} from "../../../models/approval/ApprovalStepModel";
import {DialogService} from "../../../services/dialog.service";

@Component({
  selector: 'app-approve-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    NgStyle
  ],
  templateUrl: './approve-dialog.component.html',
  styleUrl: './approve-dialog.component.css'
})
export class ApproveDialogComponent implements OnInit {

  approveFormGroup: FormGroup

  showMandatoryText = false;
  isDarkMode = false;

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
  
  // Get dynamic styles based on current dark mode state (checked every time)
  getTextareaStyles() {
    // Always check current dark mode state dynamically
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return {
      'background-color': isDarkMode ? 'rgb(31, 41, 55) !important' : 'rgb(255, 255, 255) !important',
      'border-color': isDarkMode ? 'rgb(75, 85, 99) !important' : 'rgb(209, 213, 219) !important',
      'color': isDarkMode ? 'rgb(243, 244, 246) !important' : 'rgb(17, 24, 39) !important'
    };
  }
  
  // Get dynamic styles for step info card
  getStepCardStyles() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return {
      'background': isDarkMode 
        ? 'linear-gradient(135deg, rgb(31, 41, 55) 0%, rgb(17, 24, 39) 100%)' 
        : 'linear-gradient(135deg, rgb(249, 250, 251) 0%, rgb(243, 244, 246) 100%)',
      'border-color': isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)'
    };
  }
  
  // Get dynamic styles for action buttons area
  getActionAreaStyles() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return {
      'background-color': isDarkMode ? 'rgb(31, 41, 55)' : 'rgb(249, 250, 251)',
      'border-top-color': isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'
    };
  }
  
  // Get text color classes for step card content
  getStepCardTextClasses() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return {
      'h3': isDarkMode ? 'text-gray-100' : 'text-gray-900',
      'p': isDarkMode ? 'text-gray-300' : 'text-gray-600'
    };
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
    console.log('Submitting approval step change:', {
      statusID,
      approvalStepID: this.approvalStep.ID,
      approvalId: this.approvalStep.approvalID,
      comment: this.approveFormGroup.value.comment
    });
    
    this.rest.changeStatusApprovalStep({statusID: statusID, approvalStepID: this.approvalStep.ID, comment: this.approveFormGroup.value.comment, approvalId: this.approvalStep.approvalID, nextStep: this.nextStep}).subscribe(res => {
      console.log('Approval step change response:', res);
      console.log('Backend response details:', {
        status: res.status,
        allApproved: res.data?.allApproved,
        approvalStep: res.data?.approvalStep,
        fullDataKeys: res.data ? Object.keys(res.data) : 'no data'
      });
      
      if (res.status === 200) {
        // Return the full response data to allow parent components to handle the update
        this.dialogRef.close({
          status: res.status, 
          approvalStep: res.data.approvalStep,
          allApproved: res.data.allApproved,
          fullData: res.data
        });
        
        // Only reload if all approvals are completed and it's a critical workflow step
        if (res.data.allApproved && (statusID === 2)) {
          console.log('All approvals completed! Backend says allApproved=true');
          // DO NOT reload the page - let parent components handle UI updates
          // The parent flow components (py-flow, stuffing-flow) will handle state updates
          console.log('Letting parent components handle approval completion UI updates');
        } else if (statusID === 2) {
          console.log('Approval step completed but not all approvals done. allApproved =', res.data.allApproved);
        }

      } else {
        console.log('Approval step change failed with status:', res.status);
        this.dialogRef.close({status: res.status, error: true});
        // Use DialogService instead of alert for better UX
        // alert("Something went wrong");
      }
    })
  }
}
