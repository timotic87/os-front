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
import {DealComentsDialogComponent} from "./deal-coments-dialog/deal-coments-dialog.component";
import {UserService} from "../../services/user.service";
import {io, Socket} from "socket.io-client";
import {environment} from "../../../environments/environment";
import {socketEnum} from "../../services/enum-sevice";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {HistoryDialogComponent} from "../../customComponents/history-dialog/history-dialog.component";
import {firstValueFrom} from "rxjs";
import {PyFlowComponent} from "./py-flow/py-flow.component";

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
    PyFlowComponent
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

  commentPerm: boolean = false;
  createCommentPerm: boolean = false;

  socket: Socket;


  constructor(private route: ActivatedRoute, private matDialog: MatDialog, private userService: UserService,
              private rest: RestService, private dialogService: DialogService) {
    this.dealID = +this.route.snapshot.paramMap.get('id');
    this.sockets();
    this.getDealFunc(this.dealID);
    this.getLastComment(this.dealID);
    this.checkPermission();
  }

  ngOnInit(): void {
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
    this.rest.getDealByID(id).subscribe(res=>{
      this.dialogService.closeLoader()
      if (res.status === 200){
        this.deal = res.data;
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
    this.dialogService.showLoader();
    this.rest.changeDealStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res)=>{
        console.log(res)
        if(res.status === 200){
          this.deal.status = res.data.deal.status;
          this.deal.statusID = statusID;
          this.dialogService.showSnackBar("Project status updated successfully!", '', 3000);
        }
      },
      error: (error)=>{
        this.dialogService.showERRMsgDialog(error);
      },
      complete: ()=>{
        this.dialogService.closeLoader();
      }
    })
  }

  openHistory(){
    this.dialogService.showLoader();

    this.rest.getAuditLogsByEntityAndEntityID({entity: 'Deal', entityID: this.dealID}).subscribe({
      next: (res)=>{
        this.matDialog.open(HistoryDialogComponent, {
          width: '70vw',
          maxHeight: '90vh',
          data: res.data,
        })
      },
      error: (error)=>{
        this.dialogService.showERRMsgDialog(error);
      },
      complete: ()=>{
        this.dialogService.closeLoader();
      }
    });
  }

  async checkPermission() {

    try {
      const res = await firstValueFrom(this.rest.getUserPermissions(this.userService.getUser().id));
      const permViewComment = res.data.find(permission => permission.name === 'view_all_comments');

      if (permViewComment.userId) {
        this.commentPerm = true;
      }

      const permCreateComment = res.data.find(permission => permission.name === 'create_all_comments');

      if (permCreateComment.userId) {
        this.createCommentPerm = true;
      }

    } catch (error) {
      console.error('❌ Error while checking permissions:', error);
      this.dialogService.showMsgDialog('Error while checking permissions');
    }
  }

}
