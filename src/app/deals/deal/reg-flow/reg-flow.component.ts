import {Component, Input, OnInit, ChangeDetectorRef, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {FLOW_STATUS, DOCUMENT_TYPE} from '../../../models/flow-status.constants';
import {ClientContractDocumentStatusComponent} from "../../../flow-parts/client-contract-document-status/client-contract-document-status.component";
import {ClientDocumentStatusComponent} from "../../../flow-parts/client-document-status/client-document-status.component";
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {CommonModule} from "@angular/common";
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {DocumentService} from '../../../services/document.service';
import {RecruitingOrderFormComponent} from '../recruiting-order-form/recruiting-order-form.component';
import {MatDialog} from '@angular/material/dialog';
import {RecruitingOrderDetailsDialogComponent} from '../recruiting-order-details-dialog/recruiting-order-details-dialog.component';
import {AddPositionDialogComponent} from '../add-position-dialog/add-position-dialog.component';
// ShadCN UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-reg-flow',
  standalone: true,
  imports: [
    ClientContractDocumentStatusComponent,
    ClientDocumentStatusComponent,
    DokumentApprovalComponent,
    RecruitingOrderFormComponent,
    CommonModule,
    // ShadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    BadgeComponent,
    // Dialog Components
    AddPositionDialogComponent,
    RecruitingOrderDetailsDialogComponent
  ],
  templateUrl: './reg-flow.component.html',
  styleUrl: './reg-flow.component.css'
})
export class RegFlowComponent implements OnInit {

  @Input() deal: any;
  
  // ViewChild reference for direct component access to refresh document lists
  @ViewChild('documentComponent') documentComponent!: DokumentApprovalComponent;
  
  // Recruiting order related properties
  recruitingOrder: any = null;
  isCreatingOrder: boolean = false;

  constructor(
    private rest: RestService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private documentService: DocumentService,
    private dialog: MatDialog,
    private router: Router
  ) {
    // Listen for document approval events to refresh UI without page reload
    documentService.approvalStart.subscribe(data => {
      // Dynamic UI update - no automatic scrolling to preserve user context
    });

    documentService.addNewDocument.subscribe(data => {
      // Dynamic UI update - no automatic scrolling to preserve user context  
    });
    
    // Listen for document approval rejection
    documentService.approvalRejected.subscribe(data => {
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
    });
    
    // CRITICAL: Direct listener for approval completion from approval-step-card component
    documentService.approvalCompleted.subscribe(data => {
      if (data && data.allApproved) {
        // Check deal ID with both strict and loose equality
        const dealIdMatches = data.dealId === this.deal?.ID || data.dealId == this.deal?.ID;
        
        if (!dealIdMatches) {
          return;
        }
        
        // Document fully approved - determine next flow status and update immediately
        let nextStatusID: number = FLOW_STATUS.OFFER_CLIENT_REVIEW;

        if (data.fullData?.documentTypeID === DOCUMENT_TYPE.CONTRACT) {
          nextStatusID = FLOW_STATUS.CONTRACT_SENT_TO_CLIENT;
        } else if (data.fullData?.documentTypeID === DOCUMENT_TYPE.OFFER) {
          nextStatusID = FLOW_STATUS.OFFER_CLIENT_REVIEW;
        }
        
        // Update flow status immediately
        this.updateDealFlowStatus(nextStatusID);
      }
    });
    
    // Alternative approach: Listen for any approval completion and manually check status
    documentService.approvalStart.subscribe(data => {
      // Check for status change after delay
      setTimeout(() => {
        this.checkAndUpdateFlowStatusIfNeeded();
      }, 3000);
    });
    
    // Listen for document status changes (approved/rejected)
    documentService.documentSubmitted.subscribe(data => {
      // Only process events for current deal
      if (data.dealId !== this.deal?.ID) {
        // Try loose equality as fallback (in case of string vs number)
        if (data.dealId != this.deal?.ID) {
          return;
        }
      }
      
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
      
      // If ALL document approvals are completed (allApproved=true), update flow status
      if (data.allApproved) {
        let nextStatusID: number = FLOW_STATUS.OFFER_CLIENT_REVIEW;

        if (data.fullData && data.fullData.documentTypeID) {
          if (data.fullData.documentTypeID === DOCUMENT_TYPE.OFFER) {
            nextStatusID = FLOW_STATUS.OFFER_CLIENT_REVIEW;
          } else if (data.fullData.documentTypeID === DOCUMENT_TYPE.CONTRACT) {
            nextStatusID = FLOW_STATUS.CONTRACT_SENT_TO_CLIENT;
          }
        } else {
          const currentStatus = this.deal?.flowStatus?.ID || 0;

          if (currentStatus >= FLOW_STATUS.CONTRACT_START && currentStatus < FLOW_STATUS.CONTRACT_SENT_TO_CLIENT) {
            nextStatusID = FLOW_STATUS.CONTRACT_SENT_TO_CLIENT;
          } else if (currentStatus >= 1 && currentStatus < FLOW_STATUS.OFFER_CLIENT_REVIEW) {
            nextStatusID = FLOW_STATUS.OFFER_CLIENT_REVIEW;
          } else {
            const currentDocType = this.getCurrentDocTypeID();
            if (currentDocType === DOCUMENT_TYPE.OFFER) {
              nextStatusID = FLOW_STATUS.OFFER_CLIENT_REVIEW;
            } else if (currentDocType === DOCUMENT_TYPE.CONTRACT) {
              nextStatusID = FLOW_STATUS.CONTRACT_SENT_TO_CLIENT;
            }
          }
        }
        
        this.updateDealFlowStatus(nextStatusID);
        
        // Also refresh the deal object from the server to get latest status
        setTimeout(() => {
          this.refreshDealObject();
        }, 1500); // Delay to ensure server-side status is updated
      }
    });
  }

  ngOnInit(): void {
    // Check if there's already a recruiting order for this deal
    this.checkForExistingRecruitingOrder();
  }
  
  /**
   * Check if there's already a recruiting order for this deal
   */
  private checkForExistingRecruitingOrder(): void {
    if (this.deal?.ID && this.deal.flowStatus?.ID >= FLOW_STATUS.RECRUITING_ORDER) {
      // Make API call to check for existing recruiting order
      this.rest.getRecruitingOrderByDealId(this.deal.ID).subscribe({
        next: (res) => {
          if (res.status === 200 && res.data) {
            this.recruitingOrder = res.data;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          // This is normal - no order exists yet
        }
      });
    }
  }

  updateDealStatus(event: any): void {
    
    // Handle flow status update (when "Mark as Sent" is clicked)
    if (event['flowStatusUpdated']) {
      // Update local deal object
      this.deal.flowStatus.ID = event['newFlowStatusID'];
      // Trigger change detection
      this.cdr.detectChanges();
      return;
    }
    
    // Handle client response (when client accepts/rejects)
    if (event['clientAccepted'] === null || event['clientAccepted'] === undefined) {
      this.dialogService.showSnackBar('Choose the client response first', null, 2500);
      return;
    }
    
    if (event['clientAccepted'] === true) {
      let statusID: number = FLOW_STATUS.CONTRACT_SIGNING;
      
      this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
        next: (res) => {
          if (res.status === 200) {
            // Update local deal object instead of page reload
            this.deal.flowStatus.ID = statusID;
            this.cdr.detectChanges();
            this.dialogService.showSnackBar('Deal status updated successfully!', '', 3000);
          }
        },
        error: err => {
          this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
        }
      });
    } else {
      // Handle rejection - move back to previous step
      this.rest.clientOfferReject({dealID: this.deal.ID, event}).subscribe({
        next: (res) => {
          if (res.status === 200) {
            // Update local deal object with both statusID and flowStatusID returned from API
            if (res.data.statusID !== undefined) {
              this.deal.statusID = res.data.statusID;
              
              // If cancel was selected, fetch complete deal object to update deal.status.name in overview
              if (event.rejectedReturnTo === 'cancel') {
                this.rest.getDealByID(this.deal.ID).subscribe({
                  next: (dealRes) => {
                    if (dealRes.status === 200 && dealRes.data) {
                      // Update the deal status object to reflect the new status name
                      this.deal.status = dealRes.data.status;
                      this.cdr.detectChanges();
                    }
                  },
                  error: (err) => {
                    // Error handled silently
                  }
                });
              }
            }
            if (res.data.flowStatusID !== undefined) {
              this.deal.flowStatus.ID = res.data.flowStatusID;
            }
            
            // Refresh document data to show rejected items and activate add buttons
            this.refreshDocumentLists();
            
            this.cdr.detectChanges();
            
            // Show different messages based on what happened
            let message = 'Deal status updated successfully!';
            if (event.rejectedReturnTo === 'cancel') {
              message = 'Project has been cancelled. Deal status changed to inactive.';
            } else if (event.rejectedReturnTo === 'document') {
              message = 'Process returned to document editing step.';
            } else if (event.rejectedReturnTo === 'contractBack') {
              message = 'Process returned to contract creation step.';
            }
            
            this.dialogService.showSnackBar(message, '', 4000);
          }
        },
        error: err => {
          this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
        }
      });
    }
  }

  contractSigned(): void {
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: FLOW_STATUS.RECRUITING_ORDER}).subscribe({
      next: res => {
        if (res.status === 200) {
          this.deal.flowStatus.ID = FLOW_STATUS.RECRUITING_ORDER;
          this.cdr.detectChanges();
          this.dialogService.showSnackBar('Contract marked as signed successfully!', '', 3000);
        }
      },
      error: err => {
        this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
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
    if (statusID >= FLOW_STATUS.RECRUITING_ORDER) return 'success';
    if (statusID >= FLOW_STATUS.CONTRACT_START) return 'default';
    if (statusID >= FLOW_STATUS.CDCM_APPROVED) return 'outline';
    return 'secondary';
  }

  /**
   * Check if the deal is active (statusID = 1 means active)
   */
  isDealActive(): boolean {
    return this.deal?.statusID === 1;
  }

  /**
   * Check if actions should be disabled (when deal is not active)
   */
  isActionsDisabled(): boolean {
    return !this.isDealActive();
  }

  /**
   * Get the current document type ID based on flow status
   * For recruiting flow, always use typeID=1 (offer) as it serves as the final contract
   */
  getCurrentDocTypeID(): number {
    // In recruiting flow, we only use offer documents (typeID=1)
    // The offer document serves as the final contract, so always return 1
    return 1;
  }

  /**
   * Get the current document sub-type ID based on document type
   */
  getCurrentDocSubTypeID(): number {
    // For offer documents: subTypeID = 9
    // For contract documents: subTypeID = 3
    return this.getCurrentDocTypeID() === 1 ? 9 : 3;
  }

  /**
   * Get the current approval ID based on document type
   */
  getCurrentApprovalID(): number {
    // For offer documents: approvalID = 9
    // For contract documents: approvalID = 7
    return this.getCurrentDocTypeID() === 1 ? 9 : 7;
  }

  /**
   * Get the current document type as string
   */
  getCurrentDocType(): 'offer' | 'contract' {
    return this.getCurrentDocTypeID() === 1 ? 'offer' : 'contract';
  }

  /**
   * Check if Step 2 (Client Review) should be active
   * Step 2 is active when we're past the initial documentation phase
   */
  isStep2Active(): boolean {
    const flowStatusID = this.deal?.flowStatus?.ID || 0;
    
    // Step 2 is active when:
    // - We're in client review phase for offers (status 7-8)
    // - We're in contract documentation phase (status 9-11) - as it's accessible
    // - We're in client review phase for contracts (status 12)
    // - We're in signing phase (status 13+) - as review is completed
    return flowStatusID >= FLOW_STATUS.OFFER_CLIENT_REVIEW;
  }

  getStep2IndicatorClass(): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold';
    if (this.isStep2Active()) {
      return `${baseClasses} bg-primary/10 text-primary`;
    } else {
      return `${baseClasses} bg-muted text-muted-foreground`;
    }
  }

  getProgressPercentage(): number {
    const flowStatusID = this.deal?.flowStatus?.ID || 0;

    let stepNumber = 0;
    if (flowStatusID >= 1 && flowStatusID <= 6) {
      stepNumber = 1;
    } else if (flowStatusID === FLOW_STATUS.OFFER_CLIENT_REVIEW || flowStatusID === FLOW_STATUS.OFFER_SENT_TO_CLIENT) {
      stepNumber = 2;
    } else if (flowStatusID >= FLOW_STATUS.CONTRACT_START && flowStatusID <= FLOW_STATUS.CONTRACT_CLIENT_REVIEW) {
      stepNumber = 1;
    } else if (flowStatusID === FLOW_STATUS.CONTRACT_SENT_TO_CLIENT) {
      stepNumber = 2;
    } else if (flowStatusID === FLOW_STATUS.CONTRACT_SIGNING) {
      stepNumber = 3;
    } else if (flowStatusID >= FLOW_STATUS.RECRUITING_ORDER) {
      stepNumber = 4;
    }

    return Math.min((stepNumber / 4) * 100, 100);
  }

  getCurrentStepNumber(): number {
    const flowStatusID = this.deal?.flowStatus?.ID || 0;

    if (flowStatusID >= 1 && flowStatusID <= 6) {
      return 1;
    } else if (flowStatusID === FLOW_STATUS.OFFER_CLIENT_REVIEW || flowStatusID === FLOW_STATUS.OFFER_SENT_TO_CLIENT) {
      return 2;
    } else if (flowStatusID >= FLOW_STATUS.CONTRACT_START && flowStatusID <= FLOW_STATUS.CONTRACT_CLIENT_REVIEW) {
      return 1;
    } else if (flowStatusID === FLOW_STATUS.CONTRACT_SENT_TO_CLIENT) {
      return 2;
    } else if (flowStatusID === FLOW_STATUS.CONTRACT_SIGNING) {
      return 3;
    } else if (flowStatusID >= FLOW_STATUS.RECRUITING_ORDER) {
      return 4;
    }

    return 1;
  }

  /**
   * Refresh document lists to show updated status after approval changes
   */
  private refreshDocumentLists(): void {
    // Use the py-flow approach - call ngOnInit to refresh the component completely
    setTimeout(() => {
      // Refresh document component
      if (this.documentComponent) {
        try {
          // Call ngOnInit to refresh the component completely
          if (typeof this.documentComponent.ngOnInit === 'function') {
            this.documentComponent.ngOnInit();
          }
          
          // Try specific methods if they exist
          if (typeof this.documentComponent['getActiveOffer'] === 'function') {
            this.documentComponent['getActiveOffer']();
          }
          if (typeof this.documentComponent['getInaciveOfferDocs'] === 'function') {
            this.documentComponent['getInaciveOfferDocs']();
          }
          if (typeof (this.documentComponent as any).getActiveDocuments === 'function') {
            (this.documentComponent as any).getActiveDocuments();
          }
          if (typeof (this.documentComponent as any).getInactiveDocuments === 'function') {
            (this.documentComponent as any).getInactiveDocuments();
          }
        } catch (error) {
          // Error handled silently
        }
      }
      
      // Also notify via document service like py-flow does
      this.documentService.activeDocumentChange.next(null);
      this.documentService.inactiveDocumentChange.next([]);
    }, 500); // Add delay like py-flow
    
    // Trigger immediate change detection
    this.cdr.detectChanges();
  }

  /**
   * Update deal flow status and handle local state updates
   */
  private updateDealFlowStatus(statusID: number): void {
    if (!this.deal?.ID) {
      return;
    }
    
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res) => {
        if (res.status === 200) {
          // Update local deal object
          this.deal.flowStatus.ID = statusID;
          
          // Trigger change detection to update UI
          this.cdr.detectChanges();
          
          this.dialogService.showSnackBar('Deal status updated after document approval!', '', 3000);
        }
      },
      error: err => {
        this.dialogService.showMsgDialog('Error updating deal status: ' + err.status + ' ' + (err.error?.message || err.message));
      }
    });
  }

  /**
   * Refresh the deal object from the server to get the latest status
   */
  private refreshDealObject(): void {
    // This could fetch the latest deal data if needed
    // For now, we rely on the local updates and change detection
    this.cdr.detectChanges();
  }
  
  /**
   * Manual check if document approval is completed and update flow status accordingly
   */
  private checkAndUpdateFlowStatusIfNeeded(): void {
    // Get current document from document service
    const activeDocument = this.documentService.activeDocument;
    if (!activeDocument) {
      return;
    }
    
    if (activeDocument.statusID === 3) {
      const currentFlowStatus = this.deal?.flowStatus?.ID || 0;
      const currentDocType = this.getCurrentDocTypeID();
      const isStep2Active = this.isStep2Active();
      
      if (!isStep2Active) {
        let targetStatus: number = FLOW_STATUS.OFFER_CLIENT_REVIEW;
        if (currentDocType === DOCUMENT_TYPE.CONTRACT) {
          targetStatus = FLOW_STATUS.CONTRACT_SENT_TO_CLIENT;
        }
        
        this.updateDealFlowStatus(targetStatus);
      }
    }
  }
  
  /**
   * Handle when recruiting order creation starts
   */
  onOrderCreating(isCreating: boolean): void {
    this.isCreatingOrder = isCreating;
    this.cdr.detectChanges();
  }
  
  /**
   * Handle when recruiting order is successfully created
   */
  onOrderCreated(order: any): void {
    this.recruitingOrder = order;
    this.isCreatingOrder = false;
    
    // Force change detection
    this.cdr.detectChanges();
    
    if (this.deal?.flowStatus) {
      this.deal.flowStatus.ID = FLOW_STATUS.RECRUITING_ORDER_CREATED;
      this.cdr.detectChanges();
    }
    
    this.dialogService.showSnackBar('Recruiting order created successfully!', '', 3000);
  }
  
  /**
   * Navigate to recruiting order detail page
   */
  viewRecruitingOrder(): void {
    if (this.recruitingOrder?.ID) {
      this.router.navigate(['/recruiting-order', this.recruitingOrder.ID]);
    }
  }
  
  /**
   * Add new position to existing recruiting order
   */
  addPosition(): void {
    if (this.recruitingOrder?.ID) {
      const dialogRef = this.dialog.open(AddPositionDialogComponent, {
        width: '900px',
        maxWidth: '95vw',
        data: { orderID: this.recruitingOrder.ID }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Refresh order data after adding position
          this.rest.getRecruitingOrderByID(this.recruitingOrder.ID).subscribe({
            next: (res) => {
              if (res.status === 200 && res.data) {
                this.recruitingOrder = res.data;
                this.cdr.detectChanges();
              }
            },
            error: (err) => {
              console.error('Error refreshing order:', err);
            }
          });
        }
      });
    }
  }

}
