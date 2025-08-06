import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DatePipe, NgIf} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {StuffingFlowComponent} from "./stuffing-flow/stuffing-flow.component";
import {ApprovalModel} from "../../models/approval/approvalModel";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {FormGroup} from "@angular/forms";
import {ColorLabelComponent} from "../../customComponents/color-label/color-label.component";
import {DealComentsDialogComponent} from "../../flow-parts/deal-coments-dialog/deal-coments-dialog.component";
import {UserService} from "../../services/user.service";
import {io, Socket} from "socket.io-client";
import {environment} from "../../../environments/environment";
import {socketEnum} from "../../services/enum-sevice";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {HistoryDialogComponent} from "../../customComponents/history-dialog/history-dialog.component";
import {PyFlowComponent} from "./py-flow/py-flow.component";
import {ChangeBdConsultantDialogComponent} from "../../flow-parts/change-bd-consultant-dialog/change-bd-consultant-dialog.component";
import {RegFlowComponent} from "./reg-flow/reg-flow.component";

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    ColorLabelComponent,
    StuffingFlowComponent,
    MatMenu,
    MatMenuTrigger,
    PyFlowComponent,
    RegFlowComponent
  ],
  templateUrl: './deal.component.html',
  styleUrl: './deal.component.css'
})
export class DealComponent implements OnInit{

  file: File = null;

  dealID: number;
  deal: any;
  cdcm:any[];
  lastComment;

  approval: ApprovalModel;

  formGroup: FormGroup;


  socket: Socket;



  constructor(private route: ActivatedRoute, private matDialog: MatDialog, public userService: UserService,
              private rest: RestService, private dialogService: DialogService) {
    this.dealID = +this.route.snapshot.paramMap.get('id');
    this.sockets();
    this.getDealFunc(this.dealID);
    this.getLastComment(this.dealID);
  }

  async ngOnInit() {
    }

  openComment(){
    this.matDialog.open(DealComentsDialogComponent, {
      width: '70vh',
      maxHeight: '90vh',
      data: this.dealID
    });
  }

  getDealFunc(id: number){
    this.dialogService.showLoader();
    this.rest.getDealByID(id).subscribe({
      next: res =>{
        this.dialogService.closeLoader()
        if (res.status === 200){
          this.deal = res.data;
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    });
  }

  getLastComment(dealID){
    this.rest.getLatComment(dealID).subscribe(res=>{
      if (res.status === 200){
        this.lastComment = res.data.dealComment;
      }
    })

  }

  sockets(){
    this.socket = io(environment.SERVER_URL);
    // @ts-ignore
    this.socket.on(socketEnum.CREATE_DEAL_COMMENT, data=>{
      if(data.success && data.dealComment.dealID===this.dealID){
        this.getLastComment(this.dealID);
      }
    });
  }

  changeDealStatus(statusID){

    if (!this.userService.can('change_deal_status')){
      this.dialogService.showMsgDialog("You don't have the right to change deal status.");
      return
    }

    this.dialogService.showLoader();
    this.rest.changeDealStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res)=>{
        this.dialogService.closeLoader();
        if(res.status === 200){
          this.deal.status = res.data.deal.status;
          this.deal.statusID = statusID;
          this.dialogService.showSnackBar("Project status updated successfully!", '', 3000);
        }
      },
      error: (err)=>{
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    })
  }

  openHistory(){

    if (!this.userService.can('view_deal_history')){
      this.dialogService.showMsgDialog("You don't have the right to see the deal history.");
      return
    }

    this.dialogService.showLoader();

    this.rest.getAuditLogsByEntityAndEntityID({entity: 'Deal', entityID: this.dealID}).subscribe({
      next: (res)=>{
        this.dialogService.closeLoader();
        this.matDialog.open(HistoryDialogComponent, {
          width: '70vw',
          maxHeight: '90vh',
          data: res.data,
        })
      },
      error: (err)=>{
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    });
  }

  changeBD(){
    if (!this.userService.can('change_deal_bd')){
      this.dialogService.showMsgDialog("You don't have the right to change BD consultant.");
      return
    }


    this.matDialog.open(ChangeBdConsultantDialogComponent, {
      width: '30vw',
      data: this.dealID,
    }).afterClosed().subscribe({
      next: isOk=>{
        if(isOk){
          window.location.reload();
          window.scrollTo(0, document.body.scrollHeight);
        }
      }
    })
  }


}
