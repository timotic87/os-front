import {Component, Input, OnInit, ChangeDetectorRef, ViewChild} from '@angular/core';
import {ClientContractDocumentStatusComponent} from "../../../flow-parts/client-contract-document-status/client-contract-document-status.component";
import {ClientDocumentStatusComponent} from "../../../flow-parts/client-document-status/client-document-status.component";
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {CommonModule} from "@angular/common";
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {DocumentService} from '../../../services/document.service';
import {RecruitingOrderFormComponent} from '../recruiting-order-form/recruiting-order-form.component';
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
    BadgeComponent
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
    private documentService: DocumentService
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
        // Use the documentId or other identifiers to determine if this is offer or contract
        let nextStatusID = 7; // Default to offer completion (step 2)
        
        // Check if we can determine document type from the event data
        if (data.fullData && data.fullData.documentTypeID) {
          if (data.fullData.documentTypeID === 1) {
            // Offer document approved -> move to client offer review
            nextStatusID = 7;
          } else if (data.fullData.documentTypeID === 2) {
            // Contract document approved -> move to client contract review  
            nextStatusID = 12; // Contract review for recruiting flow
          }
        } else {
          // Fallback: Check current deal status to determine which document was approved
          const currentStatus = this.deal?.flowStatus?.ID || 0;
          
          if (currentStatus >= 9 && currentStatus < 12) {
            // We're in contract phase, so this must be contract approval
            nextStatusID = 12;
          } else if (currentStatus >= 1 && currentStatus < 7) {
            // We're in offer phase, so this must be offer approval
            nextStatusID = 7;
          } else {
            // Use the component's current context to determine document type
            const currentDocType = this.getCurrentDocTypeID();
            if (currentDocType === 1) {
              nextStatusID = 7; // Offer -> client review
            } else if (currentDocType === 2) {
              nextStatusID = 12; // Contract -> client review
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
    if (this.deal?.ID && this.deal.flowStatus?.ID >= 14) {
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
      // In recruiting flow, we always move directly to contract signing (status 13)
      // regardless of whether it was offer or contract acceptance
      let statusID = 13;
      
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
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: 14}).subscribe({
      next: res => {
        if (res.status === 200) {
          // Update local deal object instead of page reload
          this.deal.flowStatus.ID = 14;
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
    if (statusID >= 14) return 'success';  // Contract signed
    if (statusID >= 9) return 'default';   // In progress
    if (statusID >= 4) return 'outline';   // Pending approval
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
   */
  getCurrentDocTypeID(): number {
    const flowStatusID = this.deal?.flowStatus?.ID || 0;
    // If we're in contract phase (status 9+), return contract type (2)
    // Otherwise return offer type (1)
    return flowStatusID >= 9 ? 2 : 1;
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
    return flowStatusID >= 7;
  }

  /**
   * Get the step indicator class for Step 2 specifically
   */
  getStep2IndicatorClass(): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold';
    
    if (this.isStep2Active()) {
      return `${baseClasses} bg-primary/10 text-primary`; // Active step
    } else {
      return `${baseClasses} bg-muted text-muted-foreground`; // Inactive step
    }
  }

  /**
   * Get the correct progress percentage (0-100%) for the progress bar
   * Maps recruiting flow status IDs to step numbers (1-4)
   */
  getProgressPercentage(): number {
    const flowStatusID = this.deal?.flowStatus?.ID || 0;
    
    // Recruiting flow has 4 main steps:
    // Step 1: Offer/Contract Documentation (flowStatusID 1-6, 9-11) 
    // Step 2: Client Offer/Contract Review (flowStatusID 7-8, 12)
    // Step 3: Signing (flowStatusID 13)
    // Step 4: Create Recruiting Order (flowStatusID 14+)
    
    let stepNumber = 0;
    if (flowStatusID >= 1 && flowStatusID <= 6) {
      stepNumber = 1; // Offer documentation phase
    } else if (flowStatusID === 7 || flowStatusID === 8) {
      stepNumber = 2; // Client offer review phase
    } else if (flowStatusID >= 9 && flowStatusID <= 11) {
      stepNumber = 1; // Contract documentation phase (back to step 1)
    } else if (flowStatusID === 12) {
      stepNumber = 2; // Client contract review phase
    } else if (flowStatusID === 13) {
      stepNumber = 3; // Signing phase
    } else if (flowStatusID >= 14) {
      stepNumber = 4; // Create recruiting order phase
    }
    
    return Math.min((stepNumber / 4) * 100, 100);
  }

  /**
   * Get the current step number (1-4) for display
   */
  getCurrentStepNumber(): number {
    const flowStatusID = this.deal?.flowStatus?.ID || 0;
    
    if (flowStatusID >= 1 && flowStatusID <= 6) {
      return 1; // Offer documentation phase
    } else if (flowStatusID === 7 || flowStatusID === 8) {
      return 2; // Client offer review phase
    } else if (flowStatusID >= 9 && flowStatusID <= 11) {
      return 1; // Contract documentation phase (back to step 1)
    } else if (flowStatusID === 12) {
      return 2; // Client contract review phase
    } else if (flowStatusID === 13) {
      return 3; // Signing phase
    } else if (flowStatusID >= 14) {
      return 4; // Create recruiting order phase
    }
    
    return 1; // Default to step 1
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
    
    // Check if document is fully approved (status 3 = approved)
    if (activeDocument.statusID === 3) {
      const currentFlowStatus = this.deal?.flowStatus?.ID || 0;
      const currentDocType = this.getCurrentDocTypeID();
      const isStep2Active = this.isStep2Active();
      
      if (!isStep2Active) {
        let targetStatus = 7; // Default to offer review
        if (currentDocType === 2) {
          targetStatus = 12; // Contract review
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
    this.cdr.detectChanges();
    
    this.dialogService.showSnackBar('Recruiting order created successfully!', '', 3000);
  }
  
  /**
   * View recruiting order details (navigate to order management)
   */
  viewRecruitingOrder(): void {
    if (this.recruitingOrder?.ID) {
      // TODO: Navigate to recruiting order details page
      this.dialogService.showSnackBar('Order details view - Coming soon', '', 2000);
    }
  }
  
  /**
   * Add new position to existing recruiting order
   */
  addPosition(): void {
    if (this.recruitingOrder?.ID) {
      // TODO: Open add position dialog or navigate to position creation
      this.dialogService.showSnackBar('Add position functionality - Coming soon', '', 2000);
    }
  }

}
