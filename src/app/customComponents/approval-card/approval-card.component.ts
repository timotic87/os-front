import {Component, EventEmitter, Inject, Input, OnInit, Optional, Output, ChangeDetectorRef} from '@angular/core';
import {ApprovalModel} from "../../models/approval/approvalModel";
import {ColorLabelComponent} from "../color-label/color-label.component";
import {CurrencyPipe, DatePipe, NgIf, CommonModule} from "@angular/common";
import {MatMenu} from "@angular/material/menu";
import {ApprovalStepCardComponent} from "./approval-step-card/approval-step-card.component";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {HistoryModel} from "../../models/historyModel";

@Component({
  selector: 'app-approval-card',
  standalone: true,
  imports: [
    ApprovalStepCardComponent,
    CommonModule,
    NgIf
  ],
  templateUrl: './approval-card.component.html',
  styleUrl: './approval-card.component.css'
})
export class ApprovalCardComponent implements OnInit{

  @Input() approval: any;
  @Input() inlineMode: boolean = false; // Whether to show as inline badge
  @Input() autoExpand: boolean = false; // Whether to start expanded (for CDCM context)
  @Input() context: string = ''; // Context identifier (e.g., 'cdcm')
  @Output() approvalUpdated = new EventEmitter<any>();
  @Output() allApprovalsCompleted = new EventEmitter<any>();
  
  isExpanded: boolean = true; // Start expanded by default

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any, private cdr: ChangeDetectorRef) {
    if (data) {
      this.approval = data;
    }
  }

  ngOnInit(): void {
    // Auto-expand for CDCM context or when autoExpand is true
    if (this.autoExpand || this.context === 'cdcm') {
      this.isExpanded = true;
    }
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  getApprovedCount(): number {
    if (!this.approval?.steps) return 0;
    return this.approval.steps.filter(step => step.statusID === 2).length;
  }

  getPendingCount(): number {
    if (!this.approval?.steps) return 0;
    return this.approval.steps.filter(step => step.statusID === 1).length;
  }

  getDeclinedCount(): number {
    if (!this.approval?.steps) return 0;
    return this.approval.steps.filter(step => step.statusID === 3).length;
  }

  onApprovalChanged(event: any): void {
    // Update the local approval data with the new step data
    if (this.approval && this.approval.steps && event.stepIndex >= 0) {
      this.approval.steps[event.stepIndex] = event.approvalStep;
      
      // Force change detection to update the UI
      this.cdr.detectChanges();
    }
    
    // Emit the change to parent components
    this.approvalUpdated.emit({
      approval: this.approval,
      changedStep: event.approvalStep,
      stepIndex: event.stepIndex,
      fullData: event.fullData
    });
  }

  onApprovalCompleted(event: any): void {
    console.log('🚀 Approval completion event received in approval-card:', event);
    console.log('About to emit allApprovalsCompleted to parent...');
    
    // Emit completion event to parent components
    this.allApprovalsCompleted.emit({
      approval: this.approval,
      approvalId: event.approvalId,
      allSteps: event.allSteps,
      fullData: event.fullData
    });
    
    console.log('allApprovalsCompleted event emitted to parent component');
  }

}
