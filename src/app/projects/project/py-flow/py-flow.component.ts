import {Component, Input, OnInit} from '@angular/core';
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {NgIf} from "@angular/common";
import {ProjectModel} from "../../../models/projectModel";
import {MatDialog} from "@angular/material/dialog";
import {CDCMService} from "../../../services/cdcm.service";
import {ApprovalService} from "../../../services/approval.service";
import {ActivatedRoute} from "@angular/router";
import {ApprovalModel} from "../../../models/approval/approvalModel";
import {CdcmPyDialogComponent} from "../../../deals/cdcm-py-dialog/cdcm-py-dialog.component";
import {CdcmViewEditComponent} from "../../../deals/cdcm-view-edit/cdcm-view-edit.component";

@Component({
  selector: 'app-py-flow',
  standalone: true,
    imports: [
        ApprovalCardComponent,
        CdcmCardComponent,
        CdcmInactiveCardComponent,
        NgIf
    ],
  templateUrl: './py-flow.component.html',
  styleUrl: './py-flow.component.css'
})
export class PyFlowComponent {
  @Input() project: ProjectModel;

  createCDCMDisable = true;

  approval: ApprovalModel;

  constructor(private matDialog: MatDialog, public cdcmService: CDCMService, private approvalService: ApprovalService, private route: ActivatedRoute) {
    let projectId: number = +this.route.snapshot.paramMap.get('id');
    // cdcmService.getCDCMLIstByProjectId(projectId);
    //
    // cdcmService.getCDCMListSubject.subscribe(()=>{
    //   this.checkisButtonDisabled();
    //   this.getApprovals(this.cdcmService.cdcmList[0].ID);
    // })

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
    // cdcmService.updateStatusCDCMSubject.subscribe(data=>{
    //   const cdcmObj = this.cdcmService.cdcmList.find(o => o.ID === data['ID']);
    //   cdcmObj.setStatus(data['statusID'], data['statusName']);
    //   this.getApprovals(cdcmObj.ID);
    //   this.checkisButtonDisabled();
    // });
  }

  dialogCDCM() {
    this.matDialog.open(CdcmPyDialogComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.project
    });
  }

  updateCDCMarr(cdcm) {
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
      const trazeniStatusi = [1, 2];

      this.cdcmService.cdcmList.every(obj => !trazeniStatusi.includes(obj.statusID))? this.createCDCMDisable = false : this.createCDCMDisable = true;

    }
  }
}
