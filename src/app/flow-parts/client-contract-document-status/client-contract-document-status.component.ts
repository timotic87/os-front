import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf, TitleCasePipe} from "@angular/common";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-client-contract-document-status',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    TitleCasePipe,
    ButtonComponent
  ],
  templateUrl: './client-contract-document-status.component.html',
  styleUrl: './client-contract-document-status.component.css'
})
export class ClientContractDocumentStatusComponent {

  @Input() deal: any;
  @Input() documentType: 'offer' | 'contract' = 'offer'; // for label context
  @Input() actionsDisabled: boolean = false; // Disable all actions when deal is not active
  @Output() statusChange = new EventEmitter<any>();

  clientAccepted: boolean | null = null;
  rejectionReason: string = '';
  rejectedReturnTo: 'contractBack' | 'cancel' = 'contractBack';

  constructor(private rest: RestService, private dialogService: DialogService) {
  }

  markAsSent() {
    this.dialogService.showLoader();
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: 12}).subscribe({
      next: res=>{
        this.dialogService.closeLoader();
        if (res.status === 200) {
          // Update the local deal object to reflect the new status
          this.deal.flowStatus.ID = 12;
          // Show success message
          this.dialogService.showSnackBar('Contract marked as sent to client successfully!', '', 3000);
          // Emit status change event to notify parent components
          this.statusChange.emit({
            flowStatusUpdated: true,
            newFlowStatusID: 12,
            status: 'sent_to_client'
          });
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    });
  }

  submitClientResponse() {
    const updateData: any = {
      responseDate: new Date(),
      clientAccepted: this.clientAccepted
    };

    if (this.clientAccepted) {
      updateData.status = 'contractAccepted_by_client';
    } else {
      updateData.status = 'rejected_by_client';
      updateData.rejectionReason = this.rejectionReason;
      updateData.rejectedReturnTo = this.rejectedReturnTo;
    }

    this.statusChange.emit(updateData);
  }

}


