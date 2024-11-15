import {Component, Input, OnInit} from '@angular/core';
import {ColorLabelComponent} from "../color-label/color-label.component";
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {MatDialog} from "@angular/material/dialog";
import {CdcmViewEditComponent} from "../../projects/cdcm-view-edit/cdcm-view-edit.component";
import {CDCMService} from "../../services/cdcm.service";
import {CDCM} from "../../models/cdcm";

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

  statusColor: string

  constructor(private matDialog: MatDialog, private cdcmService: CDCMService) {
    cdcmService.updateStatusCDCMSubject.subscribe(cdcmObj => {
      if (cdcmObj['ID']===this.cdcm.ID){
        this.changeColorStatus(cdcmObj['statusID']);
      }

    })

  }

  ngOnInit(): void {
    this.changeColorStatus(this.cdcm.statusID);
    }

  openViewEditDialog(){
    this.matDialog.open(CdcmViewEditComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.cdcm
    })
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

}
