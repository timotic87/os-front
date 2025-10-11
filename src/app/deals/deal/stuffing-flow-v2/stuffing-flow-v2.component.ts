import {Component, Input, OnInit, ViewChild, ChangeDetectorRef} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import { NgIf, CommonModule } from "@angular/common";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CDCMService} from "../../../services/cdcm.service";
import {FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {RestService} from "../../../services/rest.service";
import {UserService} from "../../../services/user.service";
import {StaffingCdcmDialogV2Component} from "../../staffing-cdcm-dialog-v2/staffing-cdcm-dialog-v2.component";
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {CdcmViewEditComponent} from "../../cdcm-view-edit/cdcm-view-edit.component";
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {
  ClientDocumentStatusComponent
} from "../../../flow-parts/client-document-status/client-document-status.component";
import {DokumentContractApproval} from "../../../flow-parts/dokument-contract-approval/dokument-contract-approval";
import {DocumentService} from "../../../services/document.service";
import {
  ClientContractDocumentStatusComponent
} from "../../../flow-parts/client-contract-document-status/client-contract-document-status.component";
import {DialogService} from "../../../services/dialog.service";
import {ProjectCardStuffingComponent} from "./project-card-stuffing/project-card-stuffing.component";
import {PromotingProjectComponent} from "./promoting-project/promoting-project.component";

// ShadCN UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-stuffing-flow-v2',
  standalone: true,
  imports: [
    NgIf,
    CdcmCardComponent,
    ReactiveFormsModule,
    ApprovalCardComponent,
    CdcmInactiveCardComponent,
    DokumentApprovalComponent,
    FormsModule,
    ClientDocumentStatusComponent,
    DokumentContractApproval,
    ClientContractDocumentStatusComponent,
    ProjectCardStuffingComponent,
    PromotingProjectComponent,
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
  templateUrl: './stuffing-flow-v2.component.html',
  styleUrl: './stuffing-flow-v2.component.css'
})
export class StuffingFlowV2Component implements OnInit {

  canViewDocumentation = false;

  @Input() deal: any;

  approval: ApprovalModel;

  file: File;

  formGroup: FormGroup;

  activeCDCM;
  inactiveCDCM: any[];
  cdcmApproval;
  
  // ViewChild references for direct component access
  @ViewChild('offerDocumentComponent') offerDocumentComponent!: DokumentApprovalComponent;
  @ViewChild('contractDocumentComponent') contractDocumentComponent!: DokumentContractApproval;
  
  // Prevent multiple simultaneous refresh calls
  private isRefreshing = false;
  private refreshTimeout: any;

  constructor(private matDialog: MatDialog, public cdcmService: CDCMService, private rest: RestService,
              private userService: UserService, private documentService: DocumentService, private dialogService: DialogService,
              private cdr: ChangeDetectorRef) {

    documentService.approvalStart.subscribe(data=>{
      // Dynamic UI update instead of page reload
      console.log('🔥 SCROLL DEBUG [STUFFING]: Document submitted for approval, scroll position:', window.scrollY);
      // No automatic scrolling - let user stay where they are
    });

    documentService.addNewDocument.subscribe(data=>{
      // Dynamic UI update instead of page reload  
      console.log('🔥 SCROLL DEBUG [STUFFING]: New document added, scroll position:', window.scrollY);
      // No automatic scrolling - let user stay where they are
    });
    
    // Listen for document approval rejection
    documentService.approvalRejected.subscribe(data => {
      console.log('🔥 SCROLL DEBUG [STUFFING]: Document approval rejected, scroll position before:', window.scrollY);
      console.log('Document approval rejected, refreshing document lists...', data);
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
      // Check scroll position after refresh
      setTimeout(() => {
        console.log('🔥 SCROLL DEBUG [STUFFING]: Document approval rejected, scroll position after refresh:', window.scrollY);
      }, 100);
    });
    
    // Listen for document status changes (approved/rejected)
    documentService.documentSubmitted.subscribe(data => {
      console.log('🔥 SCROLL DEBUG [STUFFING]: Document status changed, scroll position before:', window.scrollY);
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
      // Check scroll position after refresh
      setTimeout(() => {
        console.log('🔥 SCROLL DEBUG [STUFFING]: Document status changed, scroll position after refresh:', window.scrollY);
      }, 100);
      
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
      this.getActiveCDCM();
      this.getApprovalsByCdcmID(this.activeCDCM.ID);
    })

  }

  ngOnInit(): void {

    this.getActiveCDCM();
    this.getInactiveCDCM();
  }

  dialogCDCMV2() {
    // New ShadCN-styled CDCM dialog - matching existing CDCM view dialog
    this.matDialog.open(StaffingCdcmDialogV2Component, {
      maxHeight: '90vh',
      width: '70vw',
      data: this.deal,
      panelClass: ['cdcm-dialog-v2'],
      hasBackdrop: true,
      disableClose: false,
      autoFocus: false
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

  getApprovalsByCdcmID(cdcmID) {
    this.rest.getApprovalsByCdcmID(cdcmID).subscribe(res=>{
      if(res.status===200){
        this.cdcmApproval = res.data;
      }
    })
  }


  openCDCMView(cdcm){
    this.matDialog.open(CdcmViewEditComponent, {
      maxHeight: '90vh',
      width: '70vw',
      data: {cdcm: cdcm}
    });
  }

  updateDealStatus(event: any){
    console.log('🔥 SCROLL DEBUG [STUFFING]: Deal status update triggered, scroll position:', window.scrollY);
    const scrollPosition = window.scrollY;
    
    // Handle flow status update (when "Mark as Sent" is clicked)
    if (event['flowStatusUpdated']) {
      console.log('🔥 SCROLL DEBUG [STUFFING]: Flow status updated:', event, 'scroll position:', window.scrollY);
      // Update local deal object
      this.deal.flowStatus.ID = event['newFlowStatusID'];
      // Trigger change detection
      this.cdr.detectChanges();
      
      // Check if scroll position was affected
      setTimeout(() => {
        const currentScrollPosition = window.scrollY;
        if (Math.abs(currentScrollPosition - scrollPosition) > 50) {
          console.log('🔥 SCROLL DEBUG [STUFFING]: Flow status update caused scroll change! Restoring position to:', scrollPosition);
          window.scrollTo({
            top: scrollPosition,
            behavior: 'instant'
          });
        }
      }, 0);
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

  // Approval event handlers
  onApprovalUpdated(event: any): void {
    console.log('Approval updated:', event);
    
    // Update the local approval data
    if (event.approval) {
      this.cdcmApproval = event.approval;
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
      // Removed duplicate call to prevent rate limiting
      setTimeout(() => {
        this.refreshAllCDCMData();
      }, 800);
    }
    
    // Force change detection after every approval update
    this.cdr.detectChanges();
  }
  
  onApprovalCompleted(event: any): void {
    console.log('🔥 SCROLL DEBUG [STUFFING]: CDCM approval completed, scroll position before:', window.scrollY);
    const scrollPosition = window.scrollY;
    
    console.log('All approvals completed:', event);
    console.log('Current deal status before CDCM approval completed:', this.deal?.flowStatus?.ID);
    console.log('Current CDCM status before approval completed:', this.activeCDCM?.statusID);
    
    // IMMEDIATELY update the local UI state for instant feedback
    const oldStatus = this.deal?.flowStatus?.ID;
    this.deal.flowStatus.ID = 4; // Set to step 2 (Offer Documentation)
    console.log(`🔥 SCROLL DEBUG [STUFFING]: Immediately updating UI: deal status ${oldStatus} -> 4, scroll position:`, window.scrollY);
    
    // Clear the active CDCM immediately since it's approved
    this.activeCDCM = null;
    this.cdcmApproval = null;
    console.log('🔥 SCROLL DEBUG [STUFFING]: Cleared active CDCM from UI, scroll position:', window.scrollY);
    
    // Force multiple rounds of change detection for immediate UI update
    this.cdr.detectChanges();
    this.cdr.markForCheck();
    console.log('🔥 SCROLL DEBUG [STUFFING]: After first change detection, scroll position:', window.scrollY);
    
    // Also trigger zone run to ensure all Angular components update
    setTimeout(() => {
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      console.log('🔥 SCROLL DEBUG [STUFFING]: Forced additional change detection, scroll position:', window.scrollY);
      
      // Check if scroll position was affected by change detection
      const currentScrollPosition = window.scrollY;
      if (Math.abs(currentScrollPosition - scrollPosition) > 50) {
        console.log('🔥 SCROLL DEBUG [STUFFING]: Change detection caused scroll change! Restoring position to:', scrollPosition);
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant'
        });
      }
    }, 0);
    
    // Then update on the backend
    console.log('🔥 SCROLL DEBUG [STUFFING]: Updating backend deal status to 4 after CDCM approval completed');
    this.updateDealFlowStatus(4);
    
    // Finally refresh all data from server with a delay
    setTimeout(() => {
      console.log('🔥 SCROLL DEBUG [STUFFING]: Refreshing all data from server after approval, scroll position:', window.scrollY);
      this.refreshAllCDCMData();
      this.refreshDealObject();
    }, 1000);
    
    console.log('🔥 SCROLL DEBUG [STUFFING]: CDCM approval completed - UI should now show Step 2 as active');
  }
  
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

  // Update the deal's flow status to the specified status ID
  updateDealFlowStatus(statusID: number): void {
    console.log(`🔥 SCROLL DEBUG [STUFFING]: Attempting to update deal flow status from ${this.deal?.flowStatus?.ID} to ${statusID}, scroll position:`, window.scrollY);
    const scrollPosition = window.scrollY;
    
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res) => {
        if (res.status === 200) {
          // Update the local deal object to reflect the new status
          const oldStatus = this.deal.flowStatus.ID;
          this.deal.flowStatus.ID = statusID;
          console.log(`🔥 SCROLL DEBUG [STUFFING]: Deal flow status successfully updated from ${oldStatus} to ${statusID}, scroll position:`, window.scrollY);
          
          // Force Angular change detection to update UI immediately
          this.cdr.detectChanges();
          console.log('🔥 SCROLL DEBUG [STUFFING]: Triggered change detection after status update, scroll position:', window.scrollY);
          
          // Check if scroll position was affected by status update and change detection
          setTimeout(() => {
            const currentScrollPosition = window.scrollY;
            if (Math.abs(currentScrollPosition - scrollPosition) > 50) {
              console.log('🔥 SCROLL DEBUG [STUFFING]: Status update caused scroll change! Restoring position to:', scrollPosition);
              window.scrollTo({
                top: scrollPosition,
                behavior: 'instant'
              });
            }
          }, 100);
        }
      },
      error: (err) => {
        console.error('Failed to update deal flow status:', err);
        this.dialogService.showMsgDialog('Failed to update flow status: ' + (err.error?.message || err.status));
      }
    });
  }

  // Refresh document lists when document status changes
  refreshDocumentLists(): void {
    console.log('🔥 SCROLL DEBUG [STUFFING]: Refreshing document lists for deal:', this.deal.ID, 'scroll position before:', window.scrollY);
    
    // Store current scroll position before any changes
    const scrollPosition = window.scrollY;
    
    // Note: Do not emit approvalRejected.next() here as it creates infinite loop
    // Contract components already listen to the event from other sources
    
    // Use event-based approach instead of directly calling ngOnInit() which could reset scroll position
    setTimeout(() => {
      console.log('🔥 SCROLL DEBUG [STUFFING]: About to refresh components, scroll position:', window.scrollY);
      
      // Instead of calling ngOnInit() directly, use the document service events
      // This prevents the components from scrolling to top during initialization
      
      // Refresh offer document component (step 2) via service events instead of ngOnInit
      if (this.offerDocumentComponent) {
        console.log('🔥 SCROLL DEBUG [STUFFING]: Refreshing offer document via service events...');
        // Use service methods instead of ngOnInit to avoid scroll reset
        if (typeof (this.offerDocumentComponent as any).getActiveOffer === 'function') {
          (this.offerDocumentComponent as any).getActiveOffer();
        }
        if (typeof (this.offerDocumentComponent as any).getInaciveOfferDocs === 'function') {
          (this.offerDocumentComponent as any).getInaciveOfferDocs();
        }
      }
      
      // Refresh contract document component (step 4) via service events instead of ngOnInit
      if (this.contractDocumentComponent) {
        console.log('🔥 SCROLL DEBUG [STUFFING]: Refreshing contract document via service events...');
        // Use service methods instead of ngOnInit to avoid scroll reset
        if (typeof (this.contractDocumentComponent as any).getActiveContract === 'function') {
          (this.contractDocumentComponent as any).getActiveContract();
        }
        if (typeof (this.contractDocumentComponent as any).getInaciveOfferDocs === 'function') {
          (this.contractDocumentComponent as any).getInaciveOfferDocs();
        }
      }
      
      // Use the document service to notify all document components
      console.log('🔥 SCROLL DEBUG [STUFFING]: Notifying components via document service, scroll position:', window.scrollY);
      this.documentService.activeDocumentChange.next(null);
      this.documentService.inactiveDocumentChange.next([]);
      
      // Check if scroll position was affected and restore it if needed
      setTimeout(() => {
        const currentScrollPosition = window.scrollY;
        console.log('🔥 SCROLL DEBUG [STUFFING]: After refresh - original:', scrollPosition, 'current:', currentScrollPosition);
        
        if (Math.abs(currentScrollPosition - scrollPosition) > 50) {
          console.log('🔥 SCROLL DEBUG [STUFFING]: Significant scroll change detected! Restoring position to:', scrollPosition);
          window.scrollTo({
            top: scrollPosition,
            behavior: 'instant'
          });
        }
        
        console.log('🔥 SCROLL DEBUG [STUFFING]: Document lists refreshed, final scroll position:', window.scrollY);
      }, 100);
      
    }, 500); // Increased delay to ensure approval process completes
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

  // Refresh deal object from server to get latest flow status
  refreshDealObject(): void {
    console.log('🔥 SCROLL DEBUG [STUFFING]: Refreshing deal object from server, scroll position before:', window.scrollY);
    const scrollPosition = window.scrollY;
    
    this.rest.getDealByID(this.deal.ID).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          // Update the deal object with fresh data from server
          const oldFlowStatus = this.deal.flowStatus.ID;
          this.deal = res.data;
          const newFlowStatus = this.deal.flowStatus.ID;
          
          console.log(`🔥 SCROLL DEBUG [STUFFING]: Deal flow status refreshed: ${oldFlowStatus} -> ${newFlowStatus}, scroll position:`, window.scrollY);
          
          // Trigger change detection to update UI immediately
          setTimeout(() => {
            // Force Angular change detection
            this.cdr.detectChanges();
            console.log('🔥 SCROLL DEBUG [STUFFING]: Triggered change detection after deal refresh, scroll position:', window.scrollY);
            
            // Check if scroll position was affected and restore it if needed
            const currentScrollPosition = window.scrollY;
            if (Math.abs(currentScrollPosition - scrollPosition) > 50) {
              console.log('🔥 SCROLL DEBUG [STUFFING]: Deal refresh caused scroll change! Restoring position to:', scrollPosition);
              window.scrollTo({
                top: scrollPosition,
                behavior: 'instant'
              });
            }
          }, 100);
        }
      },
      error: (err) => {
        console.error('Failed to refresh deal object:', err);
      }
    });
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
