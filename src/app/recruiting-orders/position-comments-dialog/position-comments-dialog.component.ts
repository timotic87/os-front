import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-position-comments-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, MatDialogModule],
  templateUrl: './position-comments-dialog.component.html'
})
export class PositionCommentsDialogComponent implements OnInit {

  comments: any[] = [];
  loading = false;
  newComment = new FormControl('', [Validators.required]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { positionID: number, positionNumber?: string, positionName?: string },
    public dialogRef: MatDialogRef<PositionCommentsDialogComponent>,
    private rest: RestService,
    private dialogService: DialogService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.rest.getPositionComments(this.data.positionID).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 200) {
          this.comments = res.data?.comments || [];
        }
      },
      error: () => { this.loading = false; }
    });
  }

  send(): void {
    if (!this.userService.can('create_all_comments')) {
      this.dialogService.showMsgDialog("You don't have permission to send comments");
      return;
    }
    const text = this.newComment.value?.trim();
    if (!text) return;
    this.rest.createPositionComment({ positionID: this.data.positionID, comment: text }).subscribe({
      next: () => {
        this.newComment.reset('');
        this.load();
      },
      error: err => {
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.status));
      }
    });
  }
}
