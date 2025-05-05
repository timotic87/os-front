import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import { NgIf } from "@angular/common";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CDCMService} from "../../../services/cdcm.service";
import {FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {ApprovalService} from "../../../services/approval.service";
import {ActivatedRoute} from "@angular/router";
import {RestService} from "../../../services/rest.service";
import {UserService} from "../../../services/user.service";
import {CdcmDialogComponent} from "../../cdcm-dialog/cdcm-dialog.component";
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {CdcmViewEditComponent} from "../../cdcm-view-edit/cdcm-view-edit.component";
import {DialogService} from "../../../services/dialog.service";
import {SaveDocumetDialogComponent} from "../save-documet-dialog/save-documet-dialog.component";
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {
  ClientDocumentStatusComponent
} from "../../../flow-parts/client-document-status/client-document-status.component";
import {DokumentContractApproval} from "../../../flow-parts/dokument-contract-approval/dokument-contract-approval";
import {DocumentService} from "../../../services/document.service";

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
    DokumentContractApproval
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
              private userService: UserService, private documentService: DocumentService) {
    this.checkPermissions();

    documentService.approvalStart.subscribe(data=>{
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

  checkPermissions(){
    this.rest.getUserPermisions(this.userService.getUser().id).subscribe(res=>{
      if(res.status===200){
        let permDocView = res.data.find(permision => permision.id === 12);
        this.canViewDocumentation = permDocView.userId;
      }
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
    if (event['clientAccepted'] === true){
      this.rest.changeDealStatus({dealID: this.deal.ID, statusID: 9}).subscribe(res=>{
        window.location.reload();
        window.scrollTo(0, document.body.scrollHeight);
      });
    }else {
      this.rest.clientOfferReject({dealID: this.deal.ID, event}).subscribe(res=>{
        window.location.reload();
        window.scrollTo(0, document.body.scrollHeight);
      });
    }
    console.log(event);
  }

}
