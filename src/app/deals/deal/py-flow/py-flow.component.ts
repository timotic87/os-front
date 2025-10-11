import {Component, Input, OnInit, ChangeDetectorRef, ViewChild} from '@angular/core';
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {NgIf, CommonModule} from "@angular/common";
import {CdcmPyDialogComponent} from "../../cdcm-py-dialog/cdcm-py-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {RestService} from "../../../services/rest.service";
import {CDCMService} from "../../../services/cdcm.service";
import {DocumentService} from "../../../services/document.service";
import {CdcmPyHraViewEditComponent} from "../../cdcm-py-hra-view-edit/cdcm-py-hra-view-edit.component";
import {ClientContractDocumentStatusComponent} from "../../../flow-parts/client-contract-document-status/client-contract-document-status.component";
import {ClientDocumentStatusComponent} from "../../../flow-parts/client-document-status/client-document-status.component";
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {DokumentContractApproval} from "../../../flow-parts/dokument-contract-approval/dokument-contract-approval";
import {PromotingProjectPyhraComponent} from "./promoting-project-pyhra/promoting-project-pyhra.component";
import {ProjectCardPyhraComponent} from "./project-card-pyhra/project-card-pyhra.component";
import {DialogService} from "../../../services/dialog.service";
// ShadCN UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-py-flow',
  standalone: true,
  imports: [
    ApprovalCardComponent,
    CdcmCardComponent,
    NgIf,
    CommonModule,
    CdcmInactiveCardComponent,
    ClientContractDocumentStatusComponent,
    ClientDocumentStatusComponent,
    DokumentApprovalComponent,
    DokumentContractApproval,
    PromotingProjectPyhraComponent,
    ProjectCardPyhraComponent,
    // ShadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    BadgeComponent
  ],
  templateUrl: './py-flow.component.html',
  styleUrl: './py-flow.component.css'
})

export class PyFlowComponent implements OnInit {
  @Input() deal: any;

  activeCDCM;
  inactiveCDCM: any[];
  cdcmApproval;
  
  // ViewChild references for direct component access
  @ViewChild('offerDocumentComponent') offerDocumentComponent!: DokumentApprovalComponent;
  @ViewChild('contractDocumentComponent') contractDocumentComponent!: DokumentContractApproval;
  
  // Prevent multiple simultaneous refresh calls
  private isRefreshing = false;
  private refreshTimeout: any;

  constructor(private matDialog: MatDialog, private rest: RestService, private cdcmService: CDCMService, private documentService: DocumentService,
              private dialogService: DialogService, private cdr: ChangeDetectorRef) {

    documentService.approvalStart.subscribe(data=>{
      // Dynamic UI update instead of page reload
      console.log('Document submitted for approval, updating UI...');
      // No automatic scrolling - let user stay where they are
    });

    documentService.addNewDocument.subscribe(data=>{
      // Dynamic UI update instead of page reload  
      console.log('New document added, updating UI...');
      // No automatic scrolling - let user stay where they are
    });
    
    // Listen for document approval rejection
    documentService.approvalRejected.subscribe(data => {
      console.log('Document approval rejected, refreshing document lists...', data);
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
    });
    
    // Listen for document status changes (approved/rejected)
    documentService.documentSubmitted.subscribe(data => {
      console.log('Document status changed, refreshing document lists...', data);
      console.log('Deal ID comparison:', {
        eventDealId: data.dealId,
        currentDealId: this.deal.ID,
        allApproved: data.allApproved,
        approvalId: data.approvalId,
        fullData: data.fullData
      });
      
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
      
      // If ANY document approval is completed (allApproved=true), update flow status based on approval type
      if (data.allApproved) {
        console.log('Document fully approved, determining next flow status based on approval type...');
        
        // Use the documentId or other identifiers to determine if this is offer or contract
        // We'll get this information from the approval process
        let nextStatusID = 7; // Default to offer completion (step 3)
        
        // Check if we can determine document type from the event data
        if (data.fullData && data.fullData.documentTypeID) {
          if (data.fullData.documentTypeID === 1) {
            // Offer document approved -> move to step 3 (client review)
            nextStatusID = 7;
            console.log('Offer document approved, moving to status 7 (client offer review)');
          } else if (data.fullData.documentTypeID === 2) {
            // Contract document approved -> move to step 5 (client contract review)
            nextStatusID = 11;
            console.log('Contract document approved, moving to status 11 (client contract review)');
          }
        } else {
          // Fallback: Check current deal status to determine which document was approved
          const currentStatus = this.deal?.flowStatus?.ID || 0;
          if (currentStatus >= 9 && currentStatus < 11) {
            // We're in contract phase, so this must be contract approval
            nextStatusID = 11;
            console.log('Contract document approved (based on current status), moving to status 11');
          } else if (currentStatus >= 4 && currentStatus < 7) {
            // We're in offer phase, so this must be offer approval
            nextStatusID = 7;
            console.log('Offer document approved (based on current status), moving to status 7');
          } else {
            // Default - don't change status if we can't determine
            console.log('Could not determine document type, not changing status');
            return; // Exit early, don't update status
          }
        }
        
        this.updateDealFlowStatus(nextStatusID);
        
        // Also refresh the deal object from the server to get latest status
        setTimeout(() => {
          this.refreshDealObject();
        }, 1000); // Increased delay to ensure server-side status is updated
      }
    });

    cdcmService.updateCDCMSubject.subscribe(cdcm => {
      this.activeCDCM=cdcm.data;
    });
    cdcmService.newCDCMSubject.subscribe(cdcm => {
      if (cdcm.data.dealID===this.deal.ID){
        this.activeCDCM = cdcm.data;
      }
    })
    cdcmService.deleteCDCMSubject.subscribe(ID => {
      if (this.activeCDCM.ID === ID){
        this.activeCDCM = null;
      }
    });
    cdcmService.updateStatusCDCMSubject.subscribe(data => {
      console.log('🔄 py-flow: CDCM status update received:', data);
      this.getActiveCDCM();
      if (this.activeCDCM?.ID) {
        this.getApprovalsByCdcmID(this.activeCDCM.ID);
      }
    });
    

  }

  ngOnInit(): void {
    this.getActiveCDCM();
    this.getInactiveCDCM();
    }


  dialogCDCM(){
    this.matDialog.open(CdcmPyDialogComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.deal
    });
  }
  getActiveCDCM(){
    console.log('Fetching active CDCM for deal:', this.deal.ID);
    this.rest.getActiveCdcm(this.deal.ID).subscribe(res=>{
      console.log('Active CDCM response:', res);
      if(res.status===200){
        if(res.data) {
          console.log('Active CDCM found:', {
            ID: res.data.ID,
            statusID: res.data.statusID,
            dealID: res.data.dealID
          });
          this.activeCDCM = res.data;
          if(this.activeCDCM && this.activeCDCM.ID){
            this.getApprovalsByCdcmID(this.activeCDCM.ID);
          }
        } else {
          // No active CDCM found (may have been declined or completed)
          console.log('No active CDCM found - CDCM may have been approved and moved to inactive');
          this.activeCDCM = null;
          this.cdcmApproval = null;
        }
        // Trigger change detection after CDCM data update
        this.cdr.detectChanges();
        console.log('Change detection triggered after CDCM update');
      } else {
        console.log('Failed to fetch active CDCM, status:', res.status);
      }
    })
  }
  getApprovalsByCdcmID(cdcmID) {
    this.rest.getApprovalsByCdcmID(cdcmID).subscribe(res=>{
      if(res.status===200){
        this.cdcmApproval = res.data;
      }
    })
  }

  getInactiveCDCM(){
    console.log('Fetching inactive CDCMs for deal:', this.deal.ID);
    this.rest.getInactiveCdcms(this.deal.ID).subscribe(res=>{
      console.log('Inactive CDCM response:', res);
      if(res.status===200 && res.data){
        console.log('Inactive CDCMs found:', res.data.map(cdcm => ({ ID: cdcm.ID, statusID: cdcm.statusID })));
        this.inactiveCDCM = res.data;
      } else {
        console.log('No inactive CDCMs found');
        this.inactiveCDCM = [];
      }
    })
  }

  openCDCMView(cdcm){
    this.matDialog.open(CdcmPyHraViewEditComponent, {
      maxHeight: '90vh',
      width: '70vw',
      data: {cdcm: cdcm}
    });
  }

  updateDealStatus(event: any){
    // Handle flow status update (when "Mark as Sent" is clicked)
    if (event['flowStatusUpdated']) {
      console.log('Flow status updated:', event);
      // Update local deal object
      this.deal.flowStatus.ID = event['newFlowStatusID'];
      // Trigger change detection
      this.cdr.detectChanges();
      return;
    }
    
    // Handle client response (when client accepts/rejects)
    if (event['clientAccepted']===null){
      console.log('test')
      this.dialogService.showSnackBar('Choose the client response first', null, 2500);
      return;
    }
    
    if (event['clientAccepted'] === true){
      let statusID = 9
      if (event['status']==='contractAccepted_by_client') statusID=13
      this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
        next: (res)=>{
          if (res.status === 200) {
            // Update local deal object instead of page reload
            this.deal.flowStatus.ID = statusID;
            this.cdr.detectChanges();
            this.dialogService.showSnackBar('Deal status updated successfully!', '', 3000);
          }
        },
        error: err=>{
          this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
        }

      });
    } else {
      this.rest.clientOfferReject({dealID: this.deal.ID, event}).subscribe({
        next: (res)=>{
          if (res.status === 200) {
            // Update local deal object with the flowStatusID returned from API
            this.deal.flowStatus.ID = res.data.flowStatusID;
            console.log(`Deal flow status updated to: ${res.data.flowStatusID} after client rejection`);
            
            // Refresh CDCM and document data to show rejected items and activate add buttons
            this.getActiveCDCM();
            this.getInactiveCDCM();
            this.refreshDocumentLists();
            
            this.cdr.detectChanges();
            this.dialogService.showSnackBar('Deal status updated successfully! Process returned to previous step.', '', 4000);
          }
        },
        error: err=>{
          this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
        }

      });
    }
  }

  contractSinged(){
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: 14}).subscribe({
      next: res=>{
        if (res.status===200){
          // Update local deal object instead of page reload
          this.deal.flowStatus.ID = 14;
          this.cdr.detectChanges();
          this.dialogService.showSnackBar('Contract marked as signed successfully!', '', 3000);
        }
      },
      error: err=>{
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    });
  }

  // Helper methods for step styling
  getStepCardClass(requiredStatusID: number): string {
    const currentStatus = this.deal?.flowStatus?.ID || 0;
    const baseClasses = 'transition-all duration-200';
    
    if (currentStatus >= requiredStatusID) {
      return baseClasses; // Active step - normal styling
    } else {
      return `${baseClasses} opacity-60 bg-muted/30`; // Inactive step - muted styling
    }
  }
  
  getStepIndicatorClass(requiredStatusID: number): string {
    const currentStatus = this.deal?.flowStatus?.ID || 0;
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold';
    
    if (currentStatus >= requiredStatusID) {
      return `${baseClasses} bg-primary/10 text-primary`; // Active step
    } else {
      return `${baseClasses} bg-muted text-muted-foreground`; // Inactive step
    }
  }

  // Utility methods for ShadCN components
  getFlowStatusVariant(statusID: number): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
    if (statusID >= 14) return 'success';  // Completed
    if (statusID >= 9) return 'default';   // In progress
    if (statusID >= 4) return 'outline';   // Pending approval
    return 'secondary';
  }

  getCreateButtonText(): string {
    if (!this.activeCDCM) {
      return 'Create CDCM Calculation';
    }
    
    switch (this.activeCDCM.statusID) {
      case 1: // Draft
        return 'CDCM Already Created';
      case 2: // In Approval
        return 'CDCM in Approval Process';
      case 3: // Approved
        return 'CDCM Approved';
      case 4: // Declined
        return 'Create New CDCM (Previous Declined)';
      default:
        return 'CDCM Already Created';
    }
  }

  // CDCM Approval Event Handlers
  onApprovalUpdated(event: any): void {
    console.log('🔄 CDCM Approval step updated in py-flow:', {
      stepIndex: event.stepIndex,
      changedStepStatus: event.changedStep?.statusID,
      changedStepUser: event.changedStep?.user?.firstname + ' ' + event.changedStep?.user?.lastname,
      fullEvent: event
    });
    
    // Update the local approval data to reflect the change immediately
    if (event.approval) {
      this.cdcmApproval = event.approval;
      console.log('✨ Updated local cdcmApproval with new step data');
    }
    
    // BACKUP MECHANISM: Check if this might be the final approval step
    // If we have approval steps and all are approved (statusID = 2), treat it as completion
    if (event.approval && event.approval.steps) {
      const allStepsApproved = event.approval.steps.every(step => step.statusID === 2);
      const hasSteps = event.approval.steps.length > 0;
      
      if (allStepsApproved && hasSteps) {
        console.log('🔥 BACKUP MECHANISM: All approval steps are approved! Forcing completion...', {
          totalSteps: event.approval.steps.length,
          approvedSteps: event.approval.steps.filter(s => s.statusID === 2).length
        });
        
        // Trigger the same logic as onApprovalCompleted
        setTimeout(() => {
          this.onApprovalCompleted({
            approvalId: event.approval.ID,
            allSteps: event.approval.steps,
            fullData: event.fullData
          });
        }, 500); // Small delay to let other processes complete
      }
    }
    
    // If step was declined, the CDCM approval process is terminated
    if (event.changedStep && event.changedStep.statusID === 3) {
      console.log('CDCM approval declined, refreshing all data...');
      
      // Clear the current approval since it's terminated
      this.cdcmApproval = null;
      
      // Refresh all CDCM data with delay to ensure server-side status update is complete
      setTimeout(() => {
        this.refreshAllCDCMData();
      }, 800);
    }
    
    // Force change detection after every approval update
    this.cdr.detectChanges();
  }

  onApprovalCompleted(event: any): void {
    console.log('🎉 All CDCM approvals completed in py-flow:', event);
    console.log('Current deal status before CDCM approval completed:', this.deal?.flowStatus?.ID);
    console.log('Current CDCM status before approval completed:', this.activeCDCM?.statusID);
    
    // IMMEDIATELY update the local UI state for instant feedback
    const oldStatus = this.deal?.flowStatus?.ID;
    this.deal.flowStatus.ID = 4; // Set to step 2 (Offer Documentation)
    console.log(`Immediately updating UI: deal status ${oldStatus} -> 4`);
    
    // Clear the active CDCM immediately since it's approved
    this.activeCDCM = null;
    this.cdcmApproval = null;
    console.log('Cleared active CDCM from UI immediately');
    
    // Force multiple rounds of change detection for immediate UI update
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    
    // Also trigger zone run to ensure all Angular components update
    setTimeout(() => {
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      console.log('Forced additional change detection');
    }, 0);
    
    // Then update on the backend
    console.log('Updating backend deal status to 4 after CDCM approval completed');
    this.updateDealFlowStatus(4);
    
    // Finally refresh all data from server with a delay
    setTimeout(() => {
      console.log('Refreshing all data from server after approval...');
      this.refreshAllCDCMData();
      this.refreshDealObject();
    }, 1000);
    
    console.log('CDCM approval completed - UI should now show Step 2 as active');
  }


  // Update the deal's flow status to the specified status ID (same as stuffing-flow)
  updateDealFlowStatus(statusID: number): void {
    console.log(`Attempting to update deal flow status from ${this.deal?.flowStatus?.ID} to ${statusID}`);
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res) => {
        if (res.status === 200) {
          // Update the local deal object to reflect the new status
          const oldStatus = this.deal.flowStatus.ID;
          this.deal.flowStatus.ID = statusID;
          console.log(`Deal flow status successfully updated from ${oldStatus} to ${statusID}`);
          
          // Force Angular change detection to update UI immediately
          this.cdr.detectChanges();
          console.log('Triggered change detection after status update');
        }
      },
      error: (err) => {
        console.error('Failed to update deal flow status:', err);
        this.dialogService.showMsgDialog('Failed to update flow status: ' + (err.error?.message || err.status));
      }
    });
  }

  // Refresh all CDCM data (same pattern as stuffing-flow)
  refreshAllCDCMData(): void {
    // Prevent multiple simultaneous refresh calls to avoid 429 errors
    if (this.isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }
    
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    this.isRefreshing = true;
    console.log('Refreshing all CDCM data...');
    
    // Refresh active CDCM (this may return null if CDCM was declined)
    this.getActiveCDCM();
    
    // Add small delays between API calls to avoid rate limiting
    setTimeout(() => {
      this.getInactiveCDCM();
    }, 100);
    
    // Clear approval data if CDCM is no longer active and reset refresh flag
    this.refreshTimeout = setTimeout(() => {
      if (!this.activeCDCM) {
        console.log('No active CDCM found, clearing approval data');
        this.cdcmApproval = null;
      }
      this.isRefreshing = false;
    }, 300);
  }

  // Refresh deal object from server to get latest flow status (same as stuffing-flow)
  refreshDealObject(): void {
    console.log('Refreshing deal object from server...');
    this.rest.getDealByID(this.deal.ID).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          // Update the deal object with fresh data from server
          const oldFlowStatus = this.deal.flowStatus.ID;
          this.deal = res.data;
          const newFlowStatus = this.deal.flowStatus.ID;
          
          console.log(`Deal flow status refreshed: ${oldFlowStatus} -> ${newFlowStatus}`);
          
          // Trigger change detection to update UI immediately
          setTimeout(() => {
            // Force Angular change detection
            this.cdr.detectChanges();
            console.log('Triggering UI update after deal refresh');
          }, 100);
        }
      },
      error: (err) => {
        console.error('Failed to refresh deal object:', err);
      }
    });
  }

  // Refresh document lists when document status changes (same as stuffing-flow)
  refreshDocumentLists(): void {
    console.log('Refreshing document lists for deal:', this.deal.ID);
    
    // Note: Do not emit approvalRejected.next() here as it creates infinite loop
    // Contract components already listen to the event from other sources
    
    // Direct component refresh approach
    setTimeout(() => {
      // Refresh offer document component (step 2)
      if (this.offerDocumentComponent) {
        console.log('Directly refreshing offer document component...');
        // Check if the component has a refresh method and call it
        if (typeof this.offerDocumentComponent.ngOnInit === 'function') {
          this.offerDocumentComponent.ngOnInit();
        }
        // Also try to trigger a re-fetch of documents
        if (typeof (this.offerDocumentComponent as any).getActiveDocuments === 'function') {
          (this.offerDocumentComponent as any).getActiveDocuments();
        }
        if (typeof (this.offerDocumentComponent as any).getInactiveDocuments === 'function') {
          (this.offerDocumentComponent as any).getInactiveDocuments();
        }
      }
      
      // Refresh contract document component (step 4)
      if (this.contractDocumentComponent) {
        console.log('Directly refreshing contract document component...');
        // Check if the component has a refresh method and call it
        if (typeof this.contractDocumentComponent.ngOnInit === 'function') {
          this.contractDocumentComponent.ngOnInit();
        }
        // Also try to trigger a re-fetch of documents
        if (typeof (this.contractDocumentComponent as any).getActiveContract === 'function') {
          (this.contractDocumentComponent as any).getActiveContract();
        }
        if (typeof (this.contractDocumentComponent as any).getInaciveOfferDocs === 'function') {
          (this.contractDocumentComponent as any).getInaciveOfferDocs();
        }
      }
      
      // Also use the document service to notify all document components
      this.documentService.activeDocumentChange.next(null);
      this.documentService.inactiveDocumentChange.next([]);
      
      console.log('Document lists refreshed');
    }, 500); // Increased delay to ensure approval process completes
  }

  private checkFlowProgression(): void {
    console.log('🔍 Checking if flow should progress to next step...');
    console.log('Current deal flow status:', this.deal?.flowStatus);
    console.log('Current CDCM status:', this.activeCDCM?.statusID);
    
    // This method is no longer needed since we use immediate UI updates
    // and updateDealFlowStatus method for backend updates
    console.log('🟡 Flow progression handled by onApprovalCompleted method');
  }

  // Handle project promotion completion
  onProjectPromoted(event: any): void {
    console.log('🚀 Project promotion completed:', event);
    
    if (event.success) {
      // Immediately update the local deal object to reflect the new status
      const oldStatus = this.deal.flowStatus.ID;
      this.deal.flowStatus.ID = event.newFlowStatusID;
      console.log(`Project promoted: updating deal status from ${oldStatus} to ${event.newFlowStatusID}`);
      
      // Force change detection to update UI immediately
      this.cdr.detectChanges();
      
      // Also refresh the deal object from server to ensure we have latest data
      setTimeout(() => {
        this.refreshDealObject();
      }, 500);
      
      console.log('Project promotion UI update completed - no page reload or scroll');
    }
  }

}
