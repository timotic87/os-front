import {Component, Input, OnInit} from '@angular/core';
import {ColorLabelComponent} from "../color-label/color-label.component";
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {MatDialog} from "@angular/material/dialog";
import {CdcmViewEditComponent} from "../../projects/cdcm-view-edit/cdcm-view-edit.component";
import {CDCMService} from "../../services/cdcm.service";
import {CDCM} from "../../models/cdcm";
import {RestService} from "../../services/rest.service";
import {CommentModel} from "../../models/commentModel";
import {ShowCommentsDialogComponent} from "../show-comments-dialog/show-comments-dialog.component";
import {ProjectModel} from "../../models/projectModel";
import {CdcmPyHraViewEditComponent} from "../../projects/cdcm-py-hra-view-edit/cdcm-py-hra-view-edit.component";

@Component({
  selector: 'app-cdcm-card',
  standalone: true,
  imports: [
    ColorLabelComponent,
    DatePipe,
    MatMenuTrigger,
    CurrencyPipe,
    MatMenu,
    NgIf
  ],
  templateUrl: './cdcm-card.component.html',
  styleUrl: './cdcm-card.component.css'
})
export class CdcmCardComponent implements OnInit{

  @Input() cdcm: CDCM;
  @Input() project: ProjectModel;

  statusColor: string

  comments: CommentModel[] = [];

  constructor(private matDialog: MatDialog, private cdcmService: CDCMService, private rest: RestService) {
    cdcmService.updateStatusCDCMSubject.subscribe(cdcmObj => {
      if (cdcmObj['ID']===this.cdcm.ID){
        this.changeColorStatus(cdcmObj['statusID']);
      }

    })

  }

  ngOnInit(): void {
    this.changeColorStatus(this.cdcm.statusID);
    this.rest.getCDCMComments(this.cdcm.ID).subscribe(res=>{
      if (res.status===200 && res.data.length>0){
        for (const c of res.data){
          this.comments.push(new CommentModel(c.commentUserFirstname, c.commentUserLastname, c.commentTime, c.commentUserPicUrl, c.comment))
        }
      }
    });
    }

  openViewEditDialog(){
    console.log(this.project)
    switch (this.project.subservice.typeID){
      case 2:
        this.matDialog.open(CdcmViewEditComponent, {
          maxHeight: '90vh',
          width: '70vw',
          data: {cdcm: this.cdcm, project: this.project}
        });
        break;
        case 3:
          this.matDialog.open(CdcmPyHraViewEditComponent, {
            maxHeight: '90vh',
            width: '70vw',
            data: {cdcm: this.cdcm, project: this.project}
          });
          break
    }

  }

  deleteCDCM(id:number){
    this.cdcmService.deleteCDCM(id)
  }

  lockCDCM(ID:number){
    this.cdcmService.lockCDCM(ID,1, this.cdcm.projectID);
  }

  changeColorStatus(id:number){
    switch (id){
      case 1:
        this.statusColor = 'blue';
        break;
      case 2:
        this.statusColor = 'orange';
        break;
      case 3:
        this.statusColor = 'green';
        break;
      default:
        this.statusColor = 'red';
    }
  }
  openCommentDialog(){
    this.matDialog.open(ShowCommentsDialogComponent, {
      width: '30vw',
      maxHeight: '70vh',
      data: {title: 'Correction comments', comments: this.comments}
    })
  }

}
