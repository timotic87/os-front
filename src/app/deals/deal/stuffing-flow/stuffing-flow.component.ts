import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import { NgIf } from "@angular/common";
import {CDCM} from "../../../models/cdcm";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CDCMService} from "../../../services/cdcm.service";
import {FormGroup, ReactiveFormsModule} from "@angular/forms";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {ApprovalService} from "../../../services/approval.service";
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {ActivatedRoute} from "@angular/router";
import {DocumentListComponent} from "../../../clients/documentaton/elements/document-list/document-list.component";
import {RestService} from "../../../services/rest.service";
import {DealCardComponent} from "./deal-card/deal-card.component";
import {UserService} from "../../../services/user.service";
import {CdcmDialogComponent} from "../../cdcm-dialog/cdcm-dialog.component";
import {CdcmViewEditComponent} from "../../cdcm-view-edit/cdcm-view-edit.component";

@Component({
  selector: 'app-stuffing-flow',
  standalone: true,
  imports: [
    NgIf,
    CdcmCardComponent,
    ReactiveFormsModule
  ],
  templateUrl: './stuffing-flow.component.html',
  styleUrl: './stuffing-flow.component.css'
})
export class StuffingFlowComponent implements OnInit {

  canViewDocumentation = false;

  @Input() deal: any;

  createCDCMDisable = true;

  approval: ApprovalModel;

  file: File;

  formGroup: FormGroup;

  activeCDCM;

  constructor(private matDialog: MatDialog, public cdcmService: CDCMService, private approvalService: ApprovalService,
              private route: ActivatedRoute, private rest: RestService, private userService: UserService) {
    this.checkPermissions();
    // let projectId: number = +this.route.snapshot.paramMap.get('id');
    // cdcmService.getCDCMLIstByProjectId(projectId);
    //
    // cdcmService.getCDCMListSubject.subscribe(()=>{
    //   this.checkisButtonDisabled();
    //   this.getApprovals(this.cdcmService.cdcmList[0].ID);
    // })

    // cdcmService.updateCDCMSubject.subscribe(cdcm => {
    //   this.updateCDCMarr(cdcm);
    //   this.checkisButtonDisabled();
    // });
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
    // cdcmService.updateStatusCDCMSubject.subscribe(data=>{
    //   const cdcmObj: CDCM = this.cdcmService.cdcmList.find(o => o.ID === data['ID']);
    //   cdcmObj.setStatus(data['statusID'], data['statusName']);
    //   this.getApprovals(cdcmObj.ID);
    //   this.checkisButtonDisabled();
    // });
//todo promen na deal
    // rest.getDealByProjectId(projectId).subscribe(res => {
    //   if (res.status===200 && res.data.length>0){
    //     this.deal = res.data[0];
    //   }
    // })

  }

  ngOnInit(): void {

    this.getActiveCDCM();
  }

  dialogCDCM() {
    this.matDialog.open(CdcmDialogComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.deal
    });
  }

  updateCDCMarr(cdcm: CDCM) {
    this.cdcmService.cdcmList = this.cdcmService.cdcmList.map(item =>
      item.ID === cdcm.ID ? cdcm : item
    );

  }

  // openCDCMView(cdcm){
  //   this.matDialog.open(CdcmViewEditComponent, {
  //     maxHeight: '90vh',
  //     width: '150vh',
  //     data: {cdcm}
  //   })
  // }

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
  //
  // documentDialogOpen(){
  //   this.matDialog.open(DocumentatonComponent, {
  //     maxHeight: '90vh',
  //     width: '150vh',
  //     data: {client: this.project.client, project: this.project}
  //   })
  // }


  // createDealDialog(){
  //   this.matDialog.open(CreateDealDialogComponent, {
  //     height: '90vh',
  //     width: '50vw',
  //     data: {client: this.project.client, project: this.project}
  //     }
  //   )
  // }

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
        console.log(this.activeCDCM);
      }
    })
  }

}
