import {Component, Inject} from '@angular/core';
import {ColorLabelComponent} from "../color-label/color-label.component";
import {DatePipe, NgForOf} from "@angular/common";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ApprovalStepModel} from "../../models/approval/ApprovalStepModel";
import {CommentModel} from "../../models/commentModel";
import {comment} from "postcss";

@Component({
  selector: 'app-show-comments-dialog',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf
  ],
  templateUrl: './show-comments-dialog.component.html',
  styleUrl: './show-comments-dialog.component.css'
})
export class ShowCommentsDialogComponent {

  title: string;
  comments: CommentModel[];

  constructor(@Inject(MAT_DIALOG_DATA) private data: any, private dialogRef: MatDialogRef<ShowCommentsDialogComponent>) {
    this.title = data.title;
    this.comments = data.comments;
  }

  closeDialog(): void {
    this.dialogRef.close(true);
  }

}
