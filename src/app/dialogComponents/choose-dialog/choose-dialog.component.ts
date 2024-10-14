import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {DialogRef} from "@angular/cdk/dialog";

@Component({
  selector: 'app-choose-dialog',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './choose-dialog.component.html',
  styleUrl: './choose-dialog.component.css'
})
export class ChooseDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data, private dialogRef: MatDialogRef<ChooseDialogComponent>) {
  }

  sayNo(){
    this.dialogRef.close(false);
  }
  sayYes(){
    this.dialogRef.close(true);
  }
}
