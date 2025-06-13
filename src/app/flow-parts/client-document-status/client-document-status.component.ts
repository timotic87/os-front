import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";

@Component({
  selector: 'app-client-document-status',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
  ],
  templateUrl: './client-document-status.component.html',
  styleUrl: './client-document-status.component.css'
})
export class ClientDocumentStatusComponent {

  @Input() deal: any;
  @Input() documentType: 'offer' | 'contract' = 'offer'; // for label context
  @Output() statusChange = new EventEmitter<any>();

  clientAccepted: boolean | null = null;
  rejectionReason: string = '';
  rejectedReturnTo: 'cdcm' | 'document' = 'cdcm';

  constructor(private rest: RestService, private dialogService: DialogService) {
  }

  markAsSent() {
    this.dialogService.showLoader();
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: 8}).subscribe({
      next: res=>{
        if (res.status === 200) {
          window.location.reload();
          window.scrollTo(0, document.body.scrollHeight);
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    })
  }

  submitClientResponse() {
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


