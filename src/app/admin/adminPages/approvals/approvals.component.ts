import { Component } from '@angular/core';
import {RestService} from "../../../services/rest.service";
import {DatePipe} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {ApprovalViewEditDialogComponent} from "./approval-view-edit-dialog/approval-view-edit-dialog.component";
import {ApprovalService} from "../../../services/approval.service";
import {Subject} from "rxjs";

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    DatePipe
  ],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css'
})
export class ApprovalsComponent {

  approvals;

  constructor(rest: RestService, private matDialog: MatDialog, public approvalService: ApprovalService) {
    rest.getApprovalTemplates().subscribe(res=>{
      if(res["status"]===200){
        this.approvals = res['data'];
      }
    });

    approvalService.updateApprovalTemplteSubject.subscribe(appTemp=>{

      const index = this.approvals.findIndex(item => item.ID === appTemp.ID);
      if (index !== -1) {
        this.approvals[index].name = appTemp.approvalName;
        this.approvals[index].isSequential = appTemp.isSequential;
      }
    })

  }

  onTemplateCliclk(approval){
    this.approvalService.getApprovalTemplateByID(approval.ID).subscribe(res=>{
      this.matDialog.open(ApprovalViewEditDialogComponent, {
        width: '900px',
        height: '800px',
        data: res
      });
    });

  }

}
