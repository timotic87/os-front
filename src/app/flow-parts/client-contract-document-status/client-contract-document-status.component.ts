import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {RestService} from "../../services/rest.service";

@Component({
  selector: 'app-client-contract-document-status',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
  ],
  templateUrl: './client-contract-document-status.component.html',
  styleUrl: './client-contract-document-status.component.css'
})
export class ClientContractDocumentStatusComponent {

  @Input() deal: any;
  @Input() documentType: 'offer' | 'contract' = 'offer'; // for label context
  @Output() statusChange = new EventEmitter<any>();

  clientAccepted: boolean | null = null;
  rejectionReason: string = '';
  rejectedReturnTo: 'contractBack' | 'cancel' = 'contractBack';

  constructor(private rest: RestService) {
  }

  markAsSent() {
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: 12}).subscribe(res=>{
      if (res.status === 200) {
        window.location.reload();
        window.scrollTo(0, document.body.scrollHeight);
      }
    })
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


