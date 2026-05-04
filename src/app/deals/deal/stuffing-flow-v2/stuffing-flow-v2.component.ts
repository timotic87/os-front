import {Component, Input, OnInit, ViewChild, ChangeDetectorRef} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import { NgIf, CommonModule } from "@angular/common";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CDCMService} from "../../../services/cdcm.service";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
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
import {FLOW_STATUS, DOCUMENT_TYPE, APPROVAL_STATUS} from '../../../models/flow-status.constants';
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

  constructor(private matDialog: MatDialog, public cdcmService: CDCMService, private rest: RestService,
              private userService: UserService, private documentService: DocumentService, private dialogService: DialogService,
              private cdr: ChangeDetectorRef) {

    // Listen for document approval rejection
    documentService.approvalRejected.subscribe(data => {
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
    });

    documentService.documentSubmitted.subscribe(data => {
      // Only refresh document lists for document approvals, not CDCM approvals
      if (!data.cdcmId) {
        this.refreshDocumentLists();
      }

      // If ANY document approval is completed (allApproved=true), update flow status based on approval type
      if (data.allApproved) {
        
        // Use the documentId or other identifiers to determine if this is offer or contract
        // We'll get this information from the approval process
        let nextStatusID: number = FLOW_STATUS.OFFER_CLIENT_REVIEW;

        if (data.fullData && data.fullData.documentTypeID) {
          if (data.fullData.documentTypeID === DOCUMENT_TYPE.OFFER) {
            nextStatusID = FLOW_STATUS.OFFER_CLIENT_REVIEW;
          } else if (data.fullData.documentTypeID === DOCUMENT_TYPE.CONTRACT) {
            nextStatusID = FLOW_STATUS.CONTRACT_CLIENT_REVIEW;
          }
        } else {
          // No documentTypeID - skip if this is a CDCM approval (has cdcmId)
          if (data.cdcmId) {
            return;
          }
          const currentStatus = this.deal?.flowStatus?.ID || 0;
          if (currentStatus >= FLOW_STATUS.CONTRACT_START && currentStatus < FLOW_STATUS.CONTRACT_CLIENT_REVIEW) {
            nextStatusID = FLOW_STATUS.CONTRACT_CLIENT_REVIEW;
          } else if (currentStatus >= FLOW_STATUS.CDCM_APPROVED && currentStatus < FLOW_STATUS.OFFER_CLIENT_REVIEW) {
            nextStatusID = FLOW_STATUS.OFFER_CLIENT_REVIEW;
          } else {
            return;
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
    this.rest.getActiveCdcm(this.deal.ID).subscribe(res=>{
      if(res.status===200){
        if(res.data) {
          this.activeCDCM = res.data;
          if(this.activeCDCM && this.activeCDCM.ID){
            this.getApprovalsByCdcmID(this.activeCDCM.ID);
          }
        } else {
          // No active CDCM found (may have been declined or completed)
          this.activeCDCM = null;
          this.cdcmApproval = null;
        }
      } else {
      }
    })
  }

  getInactiveCDCM(){
    this.rest.getInactiveCdcms(this.deal.ID).subscribe(res=>{
      if(res.status===200 && res.data){
        this.inactiveCDCM = res.data;
      } else {
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
    // Handle flow status update (when "Mark as Sent" is clicked)
    if (event['flowStatusUpdated']) {
      this.deal.flowStatus.ID = event['newFlowStatusID'];
      this.cdr.detectChanges();
      return;
    }
    
    // Handle client response (when client accepts/rejects)
    if (event['clientAccepted']===null){
      this.dialogService.showSnackBar('Choose the client response first', null, 2500);
      return;
    }
    
    if (event['clientAccepted'] === true){
      let statusID: number = FLOW_STATUS.CONTRACT_START
      if (event['status']==='contractAccepted_by_client') statusID = FLOW_STATUS.CONTRACT_SIGNING
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

  contractSigned(){
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: FLOW_STATUS.RECRUITING_ORDER}).subscribe({
      next: res=>{
        if (res.status===200){
          this.deal.flowStatus.ID = FLOW_STATUS.RECRUITING_ORDER;
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
    
    // Update the local approval data
    if (event.approval) {
      this.cdcmApproval = event.approval;
    }
    
    // BACKUP MECHANISM: Check if this might be the final approval step
    // If we have approval steps and all are approved (statusID = 2), treat it as completion
    if (event.approval && event.approval.steps) {
      const allStepsApproved = event.approval.steps.every(step => step.statusID === APPROVAL_STATUS.APPROVED);
      const hasSteps = event.approval.steps.length > 0;
      
      if (allStepsApproved && hasSteps) {
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
    if (event.changedStep && event.changedStep.statusID === APPROVAL_STATUS.DECLINED) {
      
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
    this.deal.flowStatus.ID = FLOW_STATUS.CDCM_APPROVED;
    this.activeCDCM = null;
    this.cdcmApproval = null;
    this.cdr.detectChanges();

    this.updateDealFlowStatus(FLOW_STATUS.CDCM_APPROVED);

    setTimeout(() => {
      this.refreshAllCDCMData();
      this.refreshDealObject();
    }, 1000);
  }
  
  refreshAllCDCMData(): void {
    // Prevent multiple simultaneous refresh calls to avoid 429 errors
    if (this.isRefreshing) {
      return;
    }
    
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    this.isRefreshing = true;
    
    // Refresh active CDCM (this may return null if CDCM was declined)
    this.getActiveCDCM();
    
    // Add small delays between API calls to avoid rate limiting
    setTimeout(() => {
      this.getInactiveCDCM();
    }, 100);
    
    // Clear approval data if CDCM is no longer active and reset refresh flag
    this.refreshTimeout = setTimeout(() => {
      if (!this.activeCDCM) {
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

  updateDealFlowStatus(statusID: number): void {
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.deal.flowStatus.ID = statusID;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Failed to update flow status: ' + (err.error?.message || err.status));
      }
    });
  }

  refreshDocumentLists(): void {
    if (this.offerDocumentComponent) {
      if (typeof (this.offerDocumentComponent as any).getActiveOffer === 'function') {
        (this.offerDocumentComponent as any).getActiveOffer();
      }
      if (typeof (this.offerDocumentComponent as any).getInaciveOfferDocs === 'function') {
        (this.offerDocumentComponent as any).getInaciveOfferDocs();
      }
    }

    if (this.contractDocumentComponent) {
      if (typeof (this.contractDocumentComponent as any).getActiveContract === 'function') {
        (this.contractDocumentComponent as any).getActiveContract();
      }
      if (typeof (this.contractDocumentComponent as any).getInaciveOfferDocs === 'function') {
        (this.contractDocumentComponent as any).getInaciveOfferDocs();
      }
    }
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
    if (statusID >= FLOW_STATUS.RECRUITING_ORDER) return 'success';
    if (statusID >= FLOW_STATUS.CONTRACT_START) return 'default';
    if (statusID >= FLOW_STATUS.CDCM_APPROVED) return 'outline';
    return 'secondary';
  }

  refreshDealObject(): void {
    this.rest.getDealByID(this.deal.ID).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data?.flowStatus) {
          this.deal.flowStatus = res.data.flowStatus;
          this.cdr.detectChanges();
        }
      }
    });
  }

  onProjectPromoted(event: any): void {
    if (event.success) {
      this.deal.flowStatus.ID = event.newFlowStatusID;
      this.cdr.detectChanges();
      setTimeout(() => this.refreshDealObject(), 500);
    }
  }

}
