import {Component, Input, OnInit} from '@angular/core';
import {ApprovalCardComponent} from "../../../customComponents/approval-card/approval-card.component";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";
import {CdcmInactiveCardComponent} from "../../../customComponents/cdcm-inactive-card/cdcm-inactive-card.component";
import {NgIf} from "@angular/common";
import {CdcmPyDialogComponent} from "../../cdcm-py-dialog/cdcm-py-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {RestService} from "../../../services/rest.service";
import {CDCMService} from "../../../services/cdcm.service";

@Component({
  selector: 'app-py-flow',
  standalone: true,
  imports: [
    ApprovalCardComponent,
    CdcmCardComponent,
    NgIf
  ],
  templateUrl: './py-flow.component.html',
  styleUrl: './py-flow.component.css'
})

export class PyFlowComponent implements OnInit {
  @Input() deal: any;

  activeCDCM;
  inactiveCDCM: any[];
  cdcmApproval;

  constructor(private matDialog: MatDialog, private rest: RestService, private cdcmService: CDCMService) {

    cdcmService.newCDCMSubject.subscribe(cdcm => {
      if (cdcm.data.dealID===this.deal.ID){
        this.activeCDCM = cdcm.data;
      }
    });

  }

  ngOnInit(): void {
    this.getActiveCDCM();
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
      console.log(res)
      if(res.status===200){
        this.cdcmApproval = res.data;
      }
    })
  }

}
