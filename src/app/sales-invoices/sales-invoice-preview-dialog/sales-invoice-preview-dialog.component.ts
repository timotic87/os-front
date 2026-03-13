import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

export interface SalesInvoicePreviewDialogData {
  invoiceId: number;
}

@Component({
  selector: 'app-sales-invoice-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    BadgeComponent,
    ButtonComponent
  ],
  templateUrl: './sales-invoice-preview-dialog.component.html',
  styleUrl: './sales-invoice-preview-dialog.component.css'
})
export class SalesInvoicePreviewDialogComponent implements OnInit {

  invoice: any = null;
  loading = true;
  error: string | null = null;
  showRevertForm = false;
  revertNote = '';
  reverting = false;

  constructor(
    public dialogRef: MatDialogRef<SalesInvoicePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SalesInvoicePreviewDialogData,
    private rest: RestService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadInvoice();
  }

  loadInvoice(): void {
    this.loading = true;
    this.error = null;
    this.rest.getSalesInvoiceByID(this.data.invoiceId).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.invoice = res.data;
        } else {
          this.error = 'Invoice not found.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Failed to load invoice.';
        this.loading = false;
      }
    });
  }

  getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (status) {
      case 'draft': return 'secondary';
      case 'ready': return 'info';
      case 'sent': return 'success';
      default: return 'outline';
    }
  }

  toggleRevertForm(): void {
    this.showRevertForm = !this.showRevertForm;
    if (!this.showRevertForm) {
      this.revertNote = '';
    }
  }

  revertToDraft(): void {
    this.reverting = true;
    this.rest.changeStatusSalesInvoice({
      invoiceId: this.invoice.id,
      newStatus: 'draft',
      note: this.revertNote || null
    }).subscribe({
      next: (res: any) => {
        this.reverting = false;
        if (res.status === 200) {
          this.dialogService.showSnackBar('Invoice reverted to draft', '', 3000);
          this.dialogRef.close({ action: 'reverted' });
        }
      },
      error: (err: any) => {
        this.reverting = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
