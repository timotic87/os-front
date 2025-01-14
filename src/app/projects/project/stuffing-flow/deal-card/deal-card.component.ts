import {Component, Input} from '@angular/core';
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {ColorLabelComponent} from "../../../../customComponents/color-label/color-label.component";
import {MatDialog} from "@angular/material/dialog";
import {EditDealDialogComponent} from "../edit-deal-dialog/edit-deal-dialog.component";

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    CurrencyPipe,
    ColorLabelComponent
  ],
  templateUrl: './deal-card.component.html',
  styleUrl: './deal-card.component.css'
})
export class DealCardComponent {

  @Input() deal: any;

  constructor(private matDialog: MatDialog) {
    console.log(this.deal)
  }


  editDeal() {
    this.matDialog.open(EditDealDialogComponent, {
      maxHeight: '90vh',
      width: '60vw',
      data: this.deal
    })
  }

}
