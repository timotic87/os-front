import {Component, Inject} from '@angular/core';
import {ColorLabelComponent} from "../../../color-label/color-label.component";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ApprovalStepModel} from "../../../../models/approval/ApprovalStepModel";
import {DatePipe, NgIf} from "@angular/common";

@Component({
  selector: 'app-preview-step-card-dialog',
  standalone: true,
  imports: [
    ColorLabelComponent,
    DatePipe
  ],
  templateUrl: './preview-step-card-dialog.component.html',
  styleUrl: './preview-step-card-dialog.component.css'
})
export class PreviewStepCardDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public approvalStep: any, private dialogRef: MatDialogRef<PreviewStepCardDialogComponent>) {
  }

  closeDialog(){
    this.dialogRef.close();
  }
}
