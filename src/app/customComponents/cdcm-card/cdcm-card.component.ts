import {Component, Input} from '@angular/core';
import {ColorLabelComponent} from "../color-label/color-label.component";
import {CurrencyPipe, DatePipe} from "@angular/common";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {MatDialog} from "@angular/material/dialog";
import {CdcmViewEditComponent} from "../../projects/cdcm-view-edit/cdcm-view-edit.component";

@Component({
  selector: 'app-cdcm-card',
  standalone: true,
  imports: [
    ColorLabelComponent,
    DatePipe,
    MatMenuTrigger,
    CurrencyPipe,
    MatMenu
  ],
  templateUrl: './cdcm-card.component.html',
  styleUrl: './cdcm-card.component.css'
})
export class CdcmCardComponent {

  @Input() cdcm

  constructor(private matDialog: MatDialog) {
  }

  openViewEditDialog(){
    this.matDialog.open(CdcmViewEditComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.cdcm
    })
  }

}
