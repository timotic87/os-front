import {Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf, TitleCasePipe} from "@angular/common";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {FLOW_STATUS} from "../../models/flow-status.constants";
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-client-document-status',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    TitleCasePipe,
    ButtonComponent
  ],
  templateUrl: './client-document-status.component.html',
  styleUrl: './client-document-status.component.css'
})
export class ClientDocumentStatusComponent implements OnInit, OnChanges {

@Input() deal: any;
  @Input() documentType: 'offer' | 'contract' = 'offer'; // for label context
  @Input() flowType: 'recruiting' | 'py' | 'stuffing' | 'custom' = 'py'; // to determine available options
  @Input() actionsDisabled: boolean = false; // Disable all actions when deal is not active
  @Output() statusChange = new EventEmitter<any>();

  clientAccepted: boolean | null = null;
  rejectionReason: string = '';
  customState: 'send' | 'awaiting' | 'done' = 'send';
  
  private _rejectedReturnTo: 'cdcm' | 'document' | 'cancel' = 'document';
  
  get rejectedReturnTo(): 'cdcm' | 'document' | 'cancel' {
    return this._rejectedReturnTo;
  }
  
  set rejectedReturnTo(value: 'cdcm' | 'document' | 'cancel') {
    this._rejectedReturnTo = value;
  }

  constructor(private rest: RestService, private dialogService: DialogService) {
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['flowType'] && changes['flowType'].currentValue) {
      this.setDefaultRejectedReturnTo();
    }
  }

  ngOnInit() {
    this.setDefaultRejectedReturnTo();
  }
  
  private setDefaultRejectedReturnTo(): void {
    // Set default rejectedReturnTo based on flow type
    if (this.flowType === 'recruiting' || this.flowType === 'custom') {
      this.rejectedReturnTo = 'document';
    } else {
      this.rejectedReturnTo = 'cdcm'; // py and stuffing flows have CDCM step
    }
  }

  /**
   * Get flow-specific label for CDCM option
   */
  getCdcmLabel(): string {
    if (this.flowType === 'recruiting') {
      return 'Cost Recalculation'; // recruiting doesn't use CDCM terminology
    } else if (this.flowType === 'py') {
      return 'CDCM - PY Cost Recalculation';
    } else if (this.flowType === 'stuffing') {
      return 'CDCM - Stuffing Cost Recalculation';
    }
    return 'CDCM - Cost Recalculation';
  }

  /**
   * Get flow-specific label for document editing option
   */
  getDocumentEditLabel(): string {
    const docType = this.documentType;
    if (this.flowType === 'recruiting') {
      return `${docType === 'offer' ? 'Offer' : 'Contract'} editing - Edit and modify current ${docType}`;
    } else if (this.flowType === 'py') {
      return `PY ${docType === 'offer' ? 'Offer' : 'Contract'} editing - Edit and modify current ${docType}`;
    } else if (this.flowType === 'stuffing') {
      return `Stuffing ${docType === 'offer' ? 'Offer' : 'Contract'} editing - Edit and modify current ${docType}`;
    }
    return `Document editing - Edit and modify current ${docType}`;
  }

  markAsSent() {
    if (this.flowType === 'custom') {
      this.customState = 'awaiting';
      this.dialogService.showSnackBar('Marked as sent to client', '', 3000);
      return;
    }
    this.dialogService.showLoader();
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: FLOW_STATUS.OFFER_SENT_TO_CLIENT}).subscribe({
      next: res=>{
        this.dialogService.closeLoader();
        if (res.status === 200) {
          this.deal.flowStatus.ID = FLOW_STATUS.OFFER_SENT_TO_CLIENT;
          this.dialogService.showSnackBar('Offer marked as sent to client successfully!', '', 3000);
          this.statusChange.emit({
            flowStatusUpdated: true,
            newFlowStatusID: FLOW_STATUS.OFFER_SENT_TO_CLIENT,
            status: 'sent_to_client'
          });
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    })
  }

  submitClientResponse() {
    // Validate that rejectedReturnTo is valid for this flow type
    if (this.clientAccepted === false) {
      if (this.flowType === 'recruiting' && this.rejectedReturnTo === 'cdcm') {
        this.dialogService.showMsgDialog('Invalid return option selected for recruiting flow');
        return;
      }
      
      if (!this.rejectedReturnTo) {
        this.dialogService.showMsgDialog('Please select what should happen next');
        return;
      }
    }

    const updateData: any = {
      responseDate: new Date(),
      clientAccepted: this.clientAccepted
    };

    if (this.clientAccepted) {
      updateData.status = 'accepted_by_client';
    } else {
      updateData.status = 'rejected_by_client';
      updateData.rejectionReason = this.rejectionReason;
      updateData.rejectedReturnTo = this.rejectedReturnTo;
    }

    this.statusChange.emit(updateData);
  }

}


