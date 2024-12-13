import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {CdcmDialogComponent} from "../../cdcm-dialog/cdcm-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {ProjectModel} from "../../../models/projectModel";
import { NgIf } from "@angular/common";
import {CDCM} from "../../../models/cdcm";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CDCMService} from "../../../services/cdcm.service";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {CdcmViewEditComponent} from "../../cdcm-view-edit/cdcm-view-edit.component";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {ApprovalService} from "../../../services/approval.service";
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {ActivatedRoute} from "@angular/router";
import {
  ContractDocumentFormComponent
} from "../../../clients/documentaton/elements/contract-document-form/contract-document-form.component";
import {PickFileComponent} from "../../../clients/documentaton/elements/pick-file/pick-file.component";
import {DocumentatonComponent} from "../../../clients/documentaton/documentaton.component";
import {DocumentListComponent} from "../../../clients/documentaton/elements/document-list/document-list.component";
import {CreateDealDialogComponent} from "./create-deal-dialog/create-deal-dialog.component";

@Component({
  selector: 'app-stuffing-flow',
  standalone: true,
  imports: [
    NgIf,
    CdcmCardComponent,
    ReactiveFormsModule,
    CdcmInactiveCardComponent,
    ApprovalCardComponent,
    ContractDocumentFormComponent,
    PickFileComponent,
    DocumentListComponent
  ],
  templateUrl: './stuffing-flow.component.html',
  styleUrl: './stuffing-flow.component.css'
})
export class StuffingFlowComponent implements OnInit {

  @Input() project: ProjectModel;

  createCDCMDisable = true;

  approval: ApprovalModel;

  file: File;

  formGroup: FormGroup;

  constructor(private matDialog: MatDialog, public cdcmService: CDCMService, private approvalService: ApprovalService, private route: ActivatedRoute) {
    let projectId: number = +this.route.snapshot.paramMap.get('id');
    cdcmService.getCDCMLIstByProjectId(projectId);

    cdcmService.getCDCMListSubject.subscribe(()=>{
      this.checkisButtonDisabled();
      this.getApprovals(this.cdcmService.cdcmList[0].ID);
    })

    cdcmService.updateCDCMSubject.subscribe(cdcm => {
      this.updateCDCMarr(cdcm);
      this.checkisButtonDisabled();
    });
    cdcmService.newCDCMSubject.subscribe(cdcm => {
      if (cdcm.projectID===this.project.ID){
        if (!this.cdcmService.cdcmList) {
          this.cdcmService.cdcmList = [];
        }
        this.cdcmService.cdcmList.push(cdcm);
        this.checkisButtonDisabled();
      }
    })
    cdcmService.deleteCDCMSubject.subscribe(ID => {
      this.cdcmService.cdcmList = this.cdcmService.cdcmList.filter(item => item.ID !== ID);
      if (this.cdcmService.cdcmList.length === 0) this.createCDCMDisable = false;
      this.checkisButtonDisabled();
    });
    cdcmService.updateStatusCDCMSubject.subscribe(data=>{
      const cdcmObj: CDCM = this.cdcmService.cdcmList.find(o => o.ID === data['ID']);
      cdcmObj.setStatus(data['statusID'], data['statusName']);
      this.getApprovals(cdcmObj.ID);
      this.checkisButtonDisabled();
    });
  }

  ngOnInit(): void {


  }

  dialogCDCM() {
    this.matDialog.open(CdcmDialogComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.project
    });
  }

  updateCDCMarr(cdcm: CDCM) {
    this.cdcmService.cdcmList = this.cdcmService.cdcmList.map(item =>
      item.ID === cdcm.ID ? cdcm : item
    );

  }

  openCDCMView(cdcm){
    this.matDialog.open(CdcmViewEditComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: {cdcm, project: this.project}
    })
  }

  getApprovals(cdcmId: number){
    this.approvalService.getApprovalsByCdcmID(cdcmId).then(approval=>{
      this.approval=approval;
    });
  }

  checkisButtonDisabled(){
    if (!this.cdcmService.cdcmList) {
      this.createCDCMDisable = false;
    }else {
      if (this.cdcmService.cdcmList.length === 0){
        this.createCDCMDisable = false;
        return;
      }
      const trazeniStatusi = [1, 2, 3];

      this.cdcmService.cdcmList.every(obj => !trazeniStatusi.includes(obj.statusID))? this.createCDCMDisable = false : this.createCDCMDisable = true;

    }
  }

  documentDialogOpen(){
    this.matDialog.open(DocumentatonComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: {client: this.project.client, project: this.project}
    })
  }


  createDealDialog(){
    this.matDialog.open(CreateDealDialogComponent, {
      height: '90vh',
      width: '50vw'
      }
    )
  }

}
