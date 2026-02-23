import {Component, EventEmitter, Inject, Input, OnInit, OnChanges, SimpleChanges, Optional, Output, ChangeDetectorRef} from '@angular/core';
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
export class ApprovalCardComponent implements OnInit, OnChanges{

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
    this.updateExpandedState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['approval']) {
      this.updateExpandedState();
    }
  }

  private updateExpandedState(): void {
    // Auto-expand for CDCM context or when autoExpand is true
    if (this.autoExpand || this.context === 'cdcm') {
      this.isExpanded = true;
    } else if (this.isApprovalCompleted()) {
      // Collapse by default when approval is fully resolved (all approved or rejected)
      this.isExpanded = false;
    } else {
      this.isExpanded = true;
    }
  }

  isApprovalCompleted(): boolean {
    if (!this.approval?.steps || this.approval.steps.length === 0) return false;
    // Completed if all steps resolved OR if any step is declined (rejection ends the approval)
    return this.approval.steps.some((step: any) => step.statusID === 3) ||
           this.approval.steps.every((step: any) => step.statusID === 2 || step.statusID === 3);
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

      // Auto-collapse if approval is now fully completed
      if (this.isApprovalCompleted()) {
        this.isExpanded = false;
      }

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
    // Emit completion event to parent components
    this.allApprovalsCompleted.emit({
      approval: this.approval,
      approvalId: event.approvalId,
      allSteps: event.allSteps,
      fullData: event.fullData
    });
  }

}
