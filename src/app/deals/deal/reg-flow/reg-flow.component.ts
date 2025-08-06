import {Component, Input} from '@angular/core';
import {ClientContractDocumentStatusComponent} from "../../../flow-parts/client-contract-document-status/client-contract-document-status.component";
import {ClientDocumentStatusComponent} from "../../../flow-parts/client-document-status/client-document-status.component";
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {DokumentContractApproval} from "../../../flow-parts/dokument-contract-approval/dokument-contract-approval";
import {NgIf} from "@angular/common";
import {
  DocumentRegrutingCardComponent
} from "../../../flow-parts/dokument-regruting-approval/document-card/document-regruting-card.component";
import {
  DokumentRegrutingApprovalComponent
} from "../../../flow-parts/dokument-regruting-approval/dokument-regruting-approval.component";

@Component({
  selector: 'app-reg-flow',
  standalone: true,
  imports: [
    ClientContractDocumentStatusComponent,
    ClientDocumentStatusComponent,
    DokumentApprovalComponent,
    DokumentContractApproval,
    NgIf,
    DocumentRegrutingCardComponent,
    DokumentRegrutingApprovalComponent
  ],
  templateUrl: './reg-flow.component.html',
  styleUrl: './reg-flow.component.css'
})
export class RegFlowComponent {

  @Input() deal: any;

  constructor() {}

}
