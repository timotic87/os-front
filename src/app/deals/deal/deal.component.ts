import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ProjectService} from "../../services/project.service";
import {DatePipe, NgIf} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {StuffingFlowComponent} from "./stuffing-flow/stuffing-flow.component";
import {CDCM} from "../../models/cdcm";
import {ApprovalModel} from "../../models/approval/approvalModel";
import {CDCMService} from "../../services/cdcm.service";
import {PyFlowComponent} from "./py-flow/py-flow.component";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {FormGroup} from "@angular/forms";
import {ColorLabelComponent} from "../../customComponents/color-label/color-label.component";

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    StuffingFlowComponent,
    PyFlowComponent,
    ColorLabelComponent
  ],
  templateUrl: './deal.component.html',
  styleUrl: './deal.component.css'
})
export class DealComponent implements OnInit{

  file: File = null;

  dealID: number;
  deal: any;
  cdcm:CDCM[];

  approval: ApprovalModel;

  formGroup: FormGroup;


  constructor(private route: ActivatedRoute, public projectService: ProjectService, private matDialog: MatDialog,
              cdcmService: CDCMService, private rest: RestService, private dialogService: DialogService) {
    this.dealID = +this.route.snapshot.paramMap.get('id');
    this.getDealFunc(this.dealID);
  }

  ngOnInit(): void {
    }

  // openComment(){
  //   this.matDialog.open(DealComentsDialogComponent, {
  //     width: '70vh',
  //     maxHeight: '90vh',
  //     data: this.project
  //   });
  // }

  // viewHistory(){
  //   this.dialogService.showLoader();
  //   this.rest.getProjectHitory(this.projectId).subscribe(res => {
  //     this.dialogService.closseLoader();
  //     let histories: HistoryModel[] = [];
  //     if (res.status == 200) {
  //       for (let ho of res.data){
  //         histories.push(new HistoryModel(ho.ID, ho.description, ho.actionTime, ho.projectID, ho.userID, ho.firstName, ho.lastName, ho.profilePicUrl));
  //       }
  //       this.matDialog.open(HistoryDialogComponent,  {
  //         width: '40vw',
  //         height: '50vh',
  //         data: histories
  //       })
  //     }
  //   })
  // }

  getDealFunc(id: number){
    this.rest.getDealByID(id).subscribe(res=>{
      console.log(res)
      if (res.status === 200){
        this.deal = res.data;
        console.log(this.deal)
      }
    });
  }

}
