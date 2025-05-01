import {Component, Inject, Input, OnInit, Optional} from '@angular/core';
import {ApprovalModel} from "../../models/approval/approvalModel";
import {ColorLabelComponent} from "../color-label/color-label.component";
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {MatMenu} from "@angular/material/menu";
import {ApprovalStepCardComponent} from "./approval-step-card/approval-step-card.component";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {HistoryModel} from "../../models/historyModel";

@Component({
  selector: 'app-approval-card',
  standalone: true,
  imports: [
    ApprovalStepCardComponent
  ],
  templateUrl: './approval-card.component.html',
  styleUrl: './approval-card.component.css'
})
export class ApprovalCardComponent implements OnInit{

  @Input() approval: any;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data) {
      this.approval = data;
    }
  }

  ngOnInit(): void {
    }

}
