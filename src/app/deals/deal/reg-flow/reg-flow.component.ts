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
    console.log('🎆 [RECRUITING FLOW] Constructor called - subscribing to document events...');
    // Listen for document approval events to refresh UI without page reload
    documentService.approvalStart.subscribe(data => {
      console.log('[RECRUITING FLOW] Document submitted for approval, refreshing UI...', data);
      // Dynamic UI update - no automatic scrolling to preserve user context
    });

    documentService.addNewDocument.subscribe(data => {
      console.log('[RECRUITING FLOW] New document added, refreshing UI...', data);
      // Dynamic UI update - no automatic scrolling to preserve user context  
    });
    
    // Listen for document approval rejection
    documentService.approvalRejected.subscribe(data => {
      console.log('[RECRUITING FLOW] Document approval rejected, refreshing document lists...', data);
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
    });
    
    // Listen for document status changes (approved/rejected)
    documentService.documentSubmitted.subscribe(data => {
      console.log('🎯 [RECRUITING FLOW] Document status changed event received!');
      console.log('📊 Event data:', {
        eventDealId: data.dealId,
        currentDealId: this.deal?.ID,
        allApproved: data.allApproved,
        approvalId: data.approvalId,
        statusID: data.statusID,
        documentId: data.documentId,
        fullData: data.fullData
      });
      
      // Only process events for current deal
      if (data.dealId !== this.deal?.ID) {
        console.log('🚫 [RECRUITING FLOW] Event is for different deal, ignoring');
        return;
      }
      
      console.log('✅ [RECRUITING FLOW] Event is for current deal, processing...');
      
      // Refresh document lists to show updated status
      this.refreshDocumentLists();
      
      // Check if this is a single step approval or all approvals completed
      if (data.statusID === 2) {
        console.log('✅ [RECRUITING FLOW] Single approval step completed (statusID=2)');
      } else if (data.statusID === 3) {
        console.log('❌ [RECRUITING FLOW] Single approval step declined (statusID=3)');
      }
      
      // If ALL document approvals are completed (allApproved=true), update flow status
      if (data.allApproved) {
        console.log('🎉 [RECRUITING FLOW] ALL APPROVALS COMPLETED! Determining next flow status...');
        
        // Use the documentId or other identifiers to determine if this is offer or contract
        let nextStatusID = 7; // Default to offer completion (step 2)
        
        // Check if we can determine document type from the event data
        if (data.fullData && data.fullData.documentTypeID) {
          if (data.fullData.documentTypeID === 1) {
            // Offer document approved -> move to client offer review
            nextStatusID = 7;
            console.log('📄 [RECRUITING FLOW] Offer document fully approved, moving to status 7 (client offer review)');
          } else if (data.fullData.documentTypeID === 2) {
            // Contract document approved -> move to client contract review  
            nextStatusID = 12; // Changed from 11 to 12 for recruiting flow contract review
            console.log('📄 [RECRUITING FLOW] Contract document fully approved, moving to status 12 (client contract review)');
          }
        } else {
          // Fallback: Check current deal status to determine which document was approved
          const currentStatus = this.deal?.flowStatus?.ID || 0;
          console.log('🔍 [RECRUITING FLOW] Fallback: Using current status to determine document type:', currentStatus);
          
          if (currentStatus >= 9 && currentStatus < 12) {
            // We're in contract phase, so this must be contract approval
            nextStatusID = 12; // Changed from 11 to 12
            console.log('📄 [RECRUITING FLOW] Contract document approved (based on current status), moving to status 12');
          } else if (currentStatus >= 1 && currentStatus < 7) {
            // We're in offer phase, so this must be offer approval
            nextStatusID = 7;
            console.log('📄 [RECRUITING FLOW] Offer document approved (based on current status), moving to status 7');
          } else {
            console.log('⚠️ [RECRUITING FLOW] Could not determine document type from status:', currentStatus);
            console.log('🔧 [RECRUITING FLOW] Will use document type from current component context');
            
            // Use the component's current context to determine document type
            const currentDocType = this.getCurrentDocTypeID();
            if (currentDocType === 1) {
              nextStatusID = 7; // Offer -> client review
              console.log('📄 [RECRUITING FLOW] Using component context: Offer approved, moving to status 7');
            } else if (currentDocType === 2) {
              nextStatusID = 12; // Contract -> client review
              console.log('📄 [RECRUITING FLOW] Using component context: Contract approved, moving to status 12');
            }
          }
        }
        
        console.log('🚀 [RECRUITING FLOW] Will update flow status to:', nextStatusID);
        this.updateDealFlowStatus(nextStatusID);
        
        // Also refresh the deal object from the server to get latest status
        setTimeout(() => {
          console.log('🔄 [RECRUITING FLOW] Refreshing deal object from server...');
          this.refreshDealObject();
        }, 1500); // Increased delay to ensure server-side status is updated
      } else {
        console.log('⏳ [RECRUITING FLOW] Not all approvals completed yet (allApproved=false)');
      }
    });
  }

  ngOnInit(): void {
    console.log('🚀 [RECRUITING FLOW] Component initialized!');
    console.log('📋 Deal info:', {
      dealID: this.deal?.ID,
      flowStatusID: this.deal?.flowStatus?.ID,
      flowStatusName: this.deal?.flowStatus?.name,
      statusID: this.deal?.statusID
    });
    
    // Log current step status
    const isStep2Active = this.isStep2Active();
    console.log('🎯 [RECRUITING FLOW] Initial step 2 status:', isStep2Active);
    
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
            console.log('Found existing recruiting order:', res.data);
            this.recruitingOrder = res.data;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.log('No existing recruiting order found or error:', err);
          // This is normal - no order exists yet
        }
      });
    }
  }

  updateDealStatus(event: any): void {
    console.log('[RECRUITING FLOW] Updating deal status from recruiting flow:', event);
    
    // Handle flow status update (when "Mark as Sent" is clicked)
    if (event['flowStatusUpdated']) {
      console.log('[RECRUITING FLOW] Flow status updated:', event);
      // Update local deal object
      this.deal.flowStatus.ID = event['newFlowStatusID'];
      // Trigger change detection
      this.cdr.detectChanges();
      return;
    }
    
    // Handle client response (when client accepts/rejects)
    if (event['clientAccepted'] === null || event['clientAccepted'] === undefined) {
      console.log('[RECRUITING FLOW] Client response not selected:', event['clientAccepted']);
      this.dialogService.showSnackBar('Choose the client response first', null, 2500);
      return;
    }
    
    if (event['clientAccepted'] === true) {
      console.log('[RECRUITING FLOW] Client accepted document, moving directly to contract signing');
      // In recruiting flow, we always move directly to contract signing (status 13)
      // regardless of whether it was offer or contract acceptance
      let statusID = 13;
      
      if (event['status'] === 'contractAccepted_by_client') {
        console.log('[RECRUITING FLOW] Contract accepted by client, moving to status 13');
      } else if (event['status'] === 'accepted_by_client') {
        console.log('[RECRUITING FLOW] Offer accepted by client, moving directly to status 13');
      } else {
        console.log('[RECRUITING FLOW] Document accepted by client, moving to status 13');
      }
      
      this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
        next: (res) => {
          if (res.status === 200) {
            console.log(`[RECRUITING FLOW] Deal status successfully updated to: ${statusID}`);
            // Update local deal object instead of page reload
            this.deal.flowStatus.ID = statusID;
            this.cdr.detectChanges();
            this.dialogService.showSnackBar('Deal status updated successfully!', '', 3000);
          }
        },
        error: err => {
          console.error('[RECRUITING FLOW] Error updating deal status:', err);
          this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
        }
      });
    } else {
      console.log('[RECRUITING FLOW] Client rejected document, processing rejection:', event);
      // Handle rejection - move back to previous step
      this.rest.clientOfferReject({dealID: this.deal.ID, event}).subscribe({
        next: (res) => {
          if (res.status === 200) {
            console.log('[RECRUITING FLOW] Rejection processed successfully:', res.data);
            // Update local deal object with both statusID and flowStatusID returned from API
            if (res.data.statusID !== undefined) {
              this.deal.statusID = res.data.statusID;
              console.log(`[RECRUITING FLOW] Deal status updated to: ${res.data.statusID}`);
              
              // If cancel was selected, fetch complete deal object to update deal.status.name in overview
              if (event.rejectedReturnTo === 'cancel') {
                console.log('[RECRUITING FLOW] Cancel selected - fetching complete deal object to update status text');
                this.rest.getDealByID(this.deal.ID).subscribe({
                  next: (dealRes) => {
                    if (dealRes.status === 200 && dealRes.data) {
                      // Update the deal status object to reflect the new status name
                      this.deal.status = dealRes.data.status;
                      console.log('[RECRUITING FLOW] Deal status object updated:', this.deal.status.name);
                      this.cdr.detectChanges();
                    }
                  },
                  error: (err) => {
                    console.error('[RECRUITING FLOW] Error fetching updated deal:', err);
                  }
                });
              }
            }
            if (res.data.flowStatusID !== undefined) {
              this.deal.flowStatus.ID = res.data.flowStatusID;
              console.log(`[RECRUITING FLOW] Deal flow status updated to: ${res.data.flowStatusID}`);
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
          console.error('[RECRUITING FLOW] Error processing rejection:', err);
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
    const isActive = flowStatusID >= 7;
    
    console.log(`🔍 [RECRUITING FLOW] isStep2Active check:`, {
      flowStatusID: flowStatusID,
      isActive: isActive,
      dealID: this.deal?.ID
    });
    
    // Step 2 is active when:
    // - We're in client review phase for offers (status 7-8)
    // - We're in contract documentation phase (status 9-11) - as it's accessible
    // - We're in client review phase for contracts (status 12)
    // - We're in signing phase (status 13+) - as review is completed
    return isActive;
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
    console.log('[RECRUITING FLOW] Refreshing document lists...');
    
    // Use the py-flow approach - call ngOnInit to refresh the component completely
    setTimeout(() => {
      // Refresh document component
      if (this.documentComponent) {
        console.log('[RECRUITING FLOW] Refreshing document component...');
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
          console.log('[RECRUITING FLOW] Error refreshing documents:', error);
        }
      }
      
      // Also notify via document service like py-flow does
      this.documentService.activeDocumentChange.next(null);
      this.documentService.inactiveDocumentChange.next([]);
      
      console.log('[RECRUITING FLOW] Document lists refreshed');
    }, 500); // Add delay like py-flow
    
    // Trigger immediate change detection
    this.cdr.detectChanges();
  }

  /**
   * Update deal flow status and handle local state updates
   */
  private updateDealFlowStatus(statusID: number): void {
    const currentStatus = this.deal?.flowStatus?.ID || 0;
    console.log(`🔄 [RECRUITING FLOW] Updating deal flow status from ${currentStatus} to ${statusID}`);
    console.log(`📋 [RECRUITING FLOW] Deal ID: ${this.deal.ID}`);
    
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res) => {
        if (res.status === 200) {
          console.log(`✅ [RECRUITING FLOW] Deal flow status successfully updated to: ${statusID}`);
          
          // Update local deal object
          const previousStatus = this.deal.flowStatus.ID;
          this.deal.flowStatus.ID = statusID;
          
          console.log(`🔄 [RECRUITING FLOW] Local deal object updated: ${previousStatus} -> ${statusID}`);
          
          // Trigger change detection to update UI
          this.cdr.detectChanges();
          
          // Check if step 2 should now be active
          const isStep2NowActive = this.isStep2Active();
          console.log(`🎯 [RECRUITING FLOW] Step 2 active after update: ${isStep2NowActive}`);
          
          this.dialogService.showSnackBar('Deal status updated after document approval!', '', 3000);
        } else {
          console.warn(`⚠️ [RECRUITING FLOW] Unexpected response status: ${res.status}`);
        }
      },
      error: err => {
        console.error('❌ [RECRUITING FLOW] Error updating deal flow status:', err);
        console.error('❌ Error details:', {
          status: err.status,
          message: err.error?.message,
          dealID: this.deal.ID,
          statusID: statusID
        });
        this.dialogService.showMsgDialog('Error updating deal status: ' + err.status + ' ' + (err.error?.message || err.message));
      }
    });
  }

  /**
   * Refresh the deal object from the server to get the latest status
   */
  private refreshDealObject(): void {
    console.log('[RECRUITING FLOW] Refreshing deal object from server...');
    // This could fetch the latest deal data if needed
    // For now, we rely on the local updates and change detection
    this.cdr.detectChanges();
  }
  
  /**
   * Handle when recruiting order creation starts
   */
  onOrderCreating(isCreating: boolean): void {
    console.log('[RECRUITING FLOW] Order creation status changed:', isCreating);
    this.isCreatingOrder = isCreating;
    this.cdr.detectChanges();
  }
  
  /**
   * Handle when recruiting order is successfully created
   */
  onOrderCreated(order: any): void {
    console.log('[RECRUITING FLOW] Order created successfully:', order);
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
      console.log('[RECRUITING FLOW] Navigating to recruiting order:', this.recruitingOrder.ID);
      // TODO: Navigate to recruiting order details page
      this.dialogService.showSnackBar('Order details view - Coming soon', '', 2000);
    }
  }
  
  /**
   * Add new position to existing recruiting order
   */
  addPosition(): void {
    if (this.recruitingOrder?.ID) {
      console.log('[RECRUITING FLOW] Adding position to order:', this.recruitingOrder.ID);
      // TODO: Open add position dialog or navigate to position creation
      this.dialogService.showSnackBar('Add position functionality - Coming soon', '', 2000);
    }
  }

}
