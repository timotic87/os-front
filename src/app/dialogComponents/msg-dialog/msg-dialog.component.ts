import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-msg-dialog',
  standalone: true,
  imports: [],
  templateUrl: './msg-dialog.component.html',
  styleUrl: './msg-dialog.component.css'
})
export class MsgDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data, private dialogRef: MatDialogRef<MsgDialogComponent>) {
  }

  cancel(){
    this.dialogRef.close();
  }

}
