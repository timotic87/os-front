import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DatePipe, NgIf} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {StuffingFlowComponent} from "./stuffing-flow/stuffing-flow.component";
import {ApprovalModel} from "../../models/approval/approvalModel";
import {CDCMService} from "../../services/cdcm.service";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {FormGroup} from "@angular/forms";
import {ColorLabelComponent} from "../../customComponents/color-label/color-label.component";
import {DealComentsDialogComponent} from "./deal-coments-dialog/deal-coments-dialog.component";
import {UserService} from "../../services/user.service";
import {io, Socket} from "socket.io-client";
import {environment} from "../../../environments/environment";
import {socketEnum} from "../../services/enum-sevice";

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    ColorLabelComponent,
    StuffingFlowComponent
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

  getCommentPerm: boolean = false;

  socket: Socket;


  constructor(private route: ActivatedRoute, private matDialog: MatDialog, private userService: UserService,
              private rest: RestService, private dialogService: DialogService) {
    this.dealID = +this.route.snapshot.paramMap.get('id');
    this.sockets();
    this.getDealFunc(this.dealID);
    this.getLastComment(this.dealID);
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

  permisions(){
    this.userService.checkPermission(25, (hasPerm)=>{
      this.getCommentPerm = hasPerm;
    });
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

}
