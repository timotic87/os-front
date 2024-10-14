import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-multi-option-dialog',
  standalone: true,
  imports: [],
  templateUrl: './multi-option-dialog.component.html',
  styleUrl: './multi-option-dialog.component.css'
})
export class MultiOptionDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data, private dialogRef: MatDialogRef<MultiOptionDialogComponent>) {
  }


  clickOption(option){
    this.dialogRef.close(option);
  }

}
