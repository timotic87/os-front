import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-message-to-finance-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './message-to-finance-dialog.component.html'
})
export class MessageToFinanceDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message: string, invoiceNo?: string },
    public dialogRef: MatDialogRef<MessageToFinanceDialogComponent>
  ) {}
}
