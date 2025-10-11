import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DatePipe, NgIf} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {ApprovalModel} from "../../models/approval/approvalModel";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {FormGroup} from "@angular/forms";
import {ColorLabelComponent} from "../../customComponents/color-label/color-label.component";
import {DealComentsDialogComponent} from "../../flow-parts/deal-coments-dialog/deal-coments-dialog.component";
import {UserService} from "../../services/user.service";
import {socketEnum} from "../../services/enum-sevice";
import {NotificationSocketService} from "../../services/notification-socket.service";
import {MatMenu, MatMenuTrigger, MatMenuModule} from "@angular/material/menu";
import {MatDividerModule} from "@angular/material/divider";
import {HistoryDialogComponent} from "../../customComponents/history-dialog/history-dialog.component";
import {PyFlowComponent} from "./py-flow/py-flow.component";
import {ChangeBdConsultantDialogComponent} from "../../flow-parts/change-bd-consultant-dialog/change-bd-consultant-dialog.component";
import {RegFlowComponent} from "./reg-flow/reg-flow.component";
import {StuffingFlowV2Component} from "./stuffing-flow-v2/stuffing-flow-v2.component";

// ShadCN UI Components
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    ColorLabelComponent,
    MatMenu,
    MatMenuTrigger,
    MatMenuModule,
    MatDividerModule,
    PyFlowComponent,
    RegFlowComponent,
    StuffingFlowV2Component,
    // ShadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    BadgeComponent
  ],
  templateUrl: './deal.component.html',
  styleUrl: './deal.component.css'
})
export class DealComponent implements OnInit, OnDestroy {

  file: File = null;

  dealID: number;
  deal: any;
  cdcm:any[];
  lastComment;

  approval: ApprovalModel;

  formGroup: FormGroup;


  constructor(private route: ActivatedRoute, private matDialog: MatDialog, public userService: UserService,
              private rest: RestService, private dialogService: DialogService,
              private notificationSocketService: NotificationSocketService) {
    this.dealID = +this.route.snapshot.paramMap.get('id');
    // TODO: Replace socket handling with NotificationSocketService
    this.getDealFunc(this.dealID);
    this.getLastComment(this.dealID);
  }

  async ngOnInit() {
    // Socket listener removed to avoid conflicts with manual status updates
    // The deal data will be reloaded after status changes via getDealFunc()
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

  // Reload deal data without showing additional loader (used after status changes)
  reloadDealData(): void {
    this.rest.getDealByID(this.dealID).subscribe({
      next: res =>{
        this.dialogService.closeLoader(); // Close the loader from changeDealStatus
        if (res.status === 200){
          this.deal = res.data;
          console.log('🔄 Deal data reloaded successfully');
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

  // TODO: Implement proper socket handling through NotificationSocketService
  // sockets(){
  //   this.socket = io(environment.SERVER_URL);
  //   // @ts-ignore
  //   this.socket.on(socketEnum.CREATE_DEAL_COMMENT, data=>{
  //     if(data.success && data.dealComment.dealID===this.dealID){
  //       this.getLastComment(this.dealID);
  //     }
  //   });
  // }

  changeDealStatus(statusID){

    if (!this.userService.can('change_deal_status')){
      this.dialogService.showMsgDialog("You don't have the right to change deal status.");
      return
    }

    this.dialogService.showLoader();
    this.rest.changeDealStatus({dealID: this.deal.ID, statusID}).subscribe({
      next: (res)=>{
        if(res.status === 200){
          // Instead of trying to parse server response, just reload the deal
          console.log('🔄 Status change successful, reloading deal data...');
          this.reloadDealData();
          this.dialogService.showSnackBar("Project status updated successfully!", '', 3000);
        } else {
          this.dialogService.closeLoader();
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
          // Refresh deal data instead of page reload
          this.getDealFunc(this.dealID);
          this.getLastComment(this.dealID);
          // Show success message
          this.dialogService.showSnackBar('BD consultant updated successfully!', '', 3000);
        }
      }
    })
  }

  // Utility method for badge variants
  getStatusVariant(statusID: number): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (statusID === 1) return 'default';  // Active
    if (statusID === 2) return 'destructive'; // Cancelled 
    if (statusID === 3) return 'secondary'; // Stopped
    return 'outline';
  }

  // Utility method for flow status badge variants
  getFlowStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('in progress') || lowerStatus.includes('u toku')) {
      return 'info';
    } else if (lowerStatus.includes('completed') || lowerStatus.includes('završen')) {
      return 'success';
    } else if (lowerStatus.includes('review') || lowerStatus.includes('revizija')) {
      return 'warning';
    } else {
      return 'secondary';
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

}
