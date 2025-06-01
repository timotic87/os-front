import {Component, Input, OnInit} from '@angular/core';
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {NgIf} from "@angular/common";
import {CdcmPyDialogComponent} from "../../cdcm-py-dialog/cdcm-py-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {RestService} from "../../../services/rest.service";
import {CDCMService} from "../../../services/cdcm.service";
import {DocumentService} from "../../../services/document.service";
import {CdcmViewEditComponent} from "../../cdcm-view-edit/cdcm-view-edit.component";
import {CdcmPyHraViewEditComponent} from "../../cdcm-py-hra-view-edit/cdcm-py-hra-view-edit.component";
import {
  ClientContractDocumentStatusComponent
} from "../../../flow-parts/client-contract-document-status/client-contract-document-status.component";
import {
  ClientDocumentStatusComponent
} from "../../../flow-parts/client-document-status/client-document-status.component";
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {DokumentContractApproval} from "../../../flow-parts/dokument-contract-approval/dokument-contract-approval";
import {PromotingProjectComponent} from "../stuffing-flow/promoting-project/promoting-project.component";
import {PromotingProjectPyhraComponent} from "./promoting-project-pyhra/promoting-project-pyhra.component";
import {ProjectCardComponent} from "../stuffing-flow/project-card/project-card.component";
import {ProjectCardPyhraComponent} from "./project-card-pyhra/project-card-pyhra.component";

@Component({
  selector: 'app-py-flow',
  standalone: true,
  imports: [
    ApprovalCardComponent,
    CdcmCardComponent,
    NgIf,
    CdcmInactiveCardComponent,
    ClientContractDocumentStatusComponent,
    ClientDocumentStatusComponent,
    DokumentApprovalComponent,
    DokumentContractApproval,
    PromotingProjectComponent,
    PromotingProjectPyhraComponent,
    ProjectCardComponent,
    ProjectCardPyhraComponent
  ],
  templateUrl: './py-flow.component.html',
  styleUrl: './py-flow.component.css'
})

export class PyFlowComponent implements OnInit {
  @Input() deal: any;

  activeCDCM;
  inactiveCDCM: any[];
  cdcmApproval;

  constructor(private matDialog: MatDialog, private rest: RestService, private cdcmService: CDCMService, private documentService: DocumentService) {

    documentService.approvalStart.subscribe(data=>{
      window.location.reload();
      window.scrollTo(0, document.body.scrollHeight);
    });

    documentService.addNewDocument.subscribe(data=>{
      window.location.reload();
      window.scrollTo(0, document.body.scrollHeight);
    })

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


  dialogCDCM(){
    this.matDialog.open(CdcmPyDialogComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.deal
    });
  }
  getActiveCDCM(){
    this.rest.getActiveCdcm(this.deal.ID).subscribe(res=>{
      if(res.status===200){
        this.activeCDCM = res.data;
        this.getApprovalsByCdcmID(this.activeCDCM.ID);
      }
    });
  }
  getApprovalsByCdcmID(cdcmID) {
    this.rest.getApprovalsByCdcmID(cdcmID).subscribe(res=>{
      if(res.status===200){
        this.cdcmApproval = res.data;
      }
    })
  }

  getInactiveCDCM(){
    this.rest.getInactiveCdcms(this.deal.ID).subscribe(res=>{
      if(res.status===200 && res.data){
        this.inactiveCDCM = res.data;
      }
    })
  }

  openCDCMView(cdcm){
    this.matDialog.open(CdcmPyHraViewEditComponent, {
      maxHeight: '90vh',
      width: '70vw',
      data: {cdcm: cdcm}
    });
  }

  updateDealStatus(event: Event){
    if (event['clientAccepted'] === true){
      let statusID = 9
      if (event['status']==='contractAccepted_by_client') statusID=13
      this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe(res=>{
        window.location.reload();
        window.scrollTo(0, document.body.scrollHeight);
      });
    } else {
      this.rest.clientOfferReject({dealID: this.deal.ID, event}).subscribe(res=>{
        window.location.reload();
        window.scrollTo(0, document.body.scrollHeight);
      });
    }
  }

  contractSinged(){
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: 14}).subscribe(res=>{
      if (res.status===200){
        window.location.reload();
        window.scrollTo(0, document.body.scrollHeight);
      }
    });
  }

}
