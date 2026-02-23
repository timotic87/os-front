import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

export interface InvoicePreviewDialogData {
  invoiceID: number;
}

@Component({
  selector: 'app-invoice-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    BadgeComponent,
    ButtonComponent
  ],
  templateUrl: './invoice-preview-dialog.component.html',
  styleUrl: './invoice-preview-dialog.component.css'
})
export class InvoicePreviewDialogComponent implements OnInit {

  invoice: any = null;
  loading = true;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<InvoicePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvoicePreviewDialogData,
    private rest: RestService
  ) {}

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    this.loading = true;
    this.error = null;
    this.rest.getInvoicePreview(this.data.invoiceID).subscribe({
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

  getInvoiceTypeLabel(type: string): string {
    switch (type) {
      case 'placement': return 'Placement';
      case 'admin_fee': return 'Admin Fee';
      case 'cancel_fee': return 'Cancel Fee';
      default: return type;
    }
  }

  getInvoiceTypeBadgeVariant(type: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (type) {
      case 'placement': return 'success';
      case 'admin_fee': return 'info';
      case 'cancel_fee': return 'warning';
      default: return 'outline';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (status) {
      case 'pending_approval': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  }

  getFeeTypeLabel(feeTypeId: number): string {
    switch (feeTypeId) {
      case 1: return 'Percentage';
      case 2: return 'Multiplier';
      case 3: return 'Fixed';
      default: return 'N/A';
    }
  }

  getFeeConfigLabel(): string {
    const inv = this.invoice;
    if (!inv) return '';

    // For admin_fee: the fee % is applied to projected placement fee, not salary directly
    if (inv.invoice_type === 'admin_fee') {
      switch (inv.fee_types_id) {
        case 1: return `${inv.fee_percentage}% of projected placement fee`;
        case 2: return `${inv.fee_multiplier}x projected placement fee`;
        case 3: return `Fixed: ${inv.fee_fixed_amount}`;
        default: return 'N/A';
      }
    }

    // For placement/cancel_fee: use position's salaryType (fee basis), not invoice's salaryType (entered salary)
    const salaryLabel = inv.position?.salaryType?.name || inv.salaryType?.name || '';
    switch (inv.fee_types_id) {
      case 1: return salaryLabel ? `${inv.fee_percentage}% of ${salaryLabel}` : `${inv.fee_percentage}%`;
      case 2: return salaryLabel ? `${inv.fee_multiplier}x ${salaryLabel}` : `${inv.fee_multiplier}x`;
      case 3: return `Fixed: ${inv.fee_fixed_amount}`;
      default: return 'N/A';
    }
  }

  getVatLabel(): string {
    const country = this.invoice?.order?.deal?.client?.country;
    if (!country || country === 'RS') {
      return 'Domestic - 20% VAT (code: 0)';
    }
    return 'Foreign - 0% VAT (code: 12)';
  }

  close(): void {
    this.dialogRef.close();
  }
}
