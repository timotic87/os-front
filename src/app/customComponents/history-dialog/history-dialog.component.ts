import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {HistoryModel} from "../../models/historyModel";
import {DatePipe, NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-history-dialog',
  standalone: true,
  imports: [
    NgForOf,
    DatePipe,
    NgIf
  ],
  templateUrl: './history-dialog.component.html',
  styleUrl: './history-dialog.component.css'
})
export class HistoryDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public histories: any) {
  }

}
