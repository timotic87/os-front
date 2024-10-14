import {Component, Input} from '@angular/core';
import {CdcmDialogComponent} from "../../cdcm-dialog/cdcm-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {ProjectModel} from "../../../models/projectModel";
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {ColorLabelComponent} from "../../../customComponents/color-label/color-label.component";
import {CDCM} from "../../../models/cdcm";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {CdcmCardComponent} from "../../../customComponents/cdcm-card/cdcm-card.component";

@Component({
  selector: 'app-stuffing-flow',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgIf,
    ColorLabelComponent,
    DatePipe,
    MatMenuTrigger,
    MatMenu,
    CdcmCardComponent
  ],
  templateUrl: './stuffing-flow.component.html',
  styleUrl: './stuffing-flow.component.css'
})
export class StuffingFlowComponent {

  @Input() project: ProjectModel;
  @Input() cdcmARR:CDCM[];

constructor(private matDialog: MatDialog) {
}
  dialogCDCM(){
    this.matDialog.open(CdcmDialogComponent, {
      maxHeight: '90vh',
      width: '150vh',
      data: this.project
    });
  }




}
