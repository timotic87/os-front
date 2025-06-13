import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import { NgIf } from "@angular/common";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CDCMService} from "../../../services/cdcm.service";
import {FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {RestService} from "../../../services/rest.service";
import {UserService} from "../../../services/user.service";
import {CdcmDialogComponent} from "../../cdcm-dialog/cdcm-dialog.component";
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
import {PromotingProjectComponent} from "./promoting-project/promoting-project.component";
import {ProjectCardComponent} from "./project-card/project-card.component";
import {DialogService} from "../../../services/dialog.service";

@Component({
  selector: 'app-stuffing-flow',
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
    PromotingProjectComponent,
    ProjectCardComponent
  ],
  templateUrl: './stuffing-flow.component.html',
  styleUrl: './stuffing-flow.component.css'
})
export class StuffingFlowComponent implements OnInit {

  canViewDocumentation = false;

  @Input() deal: any;

  approval: ApprovalModel;

  file: File;

  formGroup: FormGroup;

  activeCDCM;
  inactiveCDCM: any[];
  cdcmApproval;

  constructor(private matDialog: MatDialog, public cdcmService: CDCMService, private rest: RestService,
              private userService: UserService, private documentService: DocumentService, private dialogService: DialogService) {

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

  dialogCDCM() {

    this.matDialog.open(CdcmDialogComponent, {
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
    })
  }

  getInactiveCDCM(){
    this.rest.getInactiveCdcms(this.deal.ID).subscribe(res=>{
      if(res.status===200 && res.data){
        this.inactiveCDCM = res.data;
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

  updateDealStatus(event: Event){
    if (event['clientAccepted']===null){
      console.log('test')
      this.dialogService.showSnackBar('Choose the client response first', null, 2500);
      return;
    }
    if (event['clientAccepted'] === true){
      let statusID = 9
      if (event['status']==='contractAccepted_by_client') statusID=13
      this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID}).subscribe({
        next: ()=>{
          window.location.reload();
          window.scrollTo(0, document.body.scrollHeight);
        },
        error: err=>{
          this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
        }

      });
    } else {
      this.rest.clientOfferReject({dealID: this.deal.ID, event}).subscribe({
        next: ()=>{
          window.location.reload();
          window.scrollTo(0, document.body.scrollHeight);
        },
        error: err=>{
          this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
        }

      });
    }
  }

  contractSinged(){
    this.rest.changeDealFlowStatus({dealID: this.deal.ID, statusID: 14}).subscribe({
      next: res=>{
        if (res.status===200){
          window.location.reload();
          window.scrollTo(0, document.body.scrollHeight);
        }
      },
      error: err=>{
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    });
  }


}
