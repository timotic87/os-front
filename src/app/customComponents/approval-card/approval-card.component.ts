import {Component, Input, OnInit} from '@angular/core';
import {ApprovalModel} from "../../models/approval/approvalModel";
import {ColorLabelComponent} from "../color-label/color-label.component";
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {MatMenu} from "@angular/material/menu";
import {ApprovalStepCardComponent} from "./approval-step-card/approval-step-card.component";

@Component({
  selector: 'app-approval-card',
  standalone: true,
  imports: [
    ColorLabelComponent,
    CurrencyPipe,
    DatePipe,
    MatMenu,
    NgIf,
    ApprovalStepCardComponent
  ],
  templateUrl: './approval-card.component.html',
  styleUrl: './approval-card.component.css'
})
export class ApprovalCardComponent implements OnInit{

  @Input() approval: ApprovalModel;

  constructor() {
  }

  ngOnInit(): void {

    }

}
