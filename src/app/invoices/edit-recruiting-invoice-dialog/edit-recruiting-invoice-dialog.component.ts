import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-edit-recruiting-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './edit-recruiting-invoice-dialog.component.html'
})
export class EditRecruitingInvoiceDialogComponent implements OnInit {

  form!: FormGroup;
  isSubmitting = false;
  currencyCode = '';
  vatPostingGroups: any[] = [];

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<EditRecruitingInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: any }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      candidate_first_name: [''],
      candidate_last_name: [''],
      final_fee_amount: [''],
      vat_prod_posting_group: ['0'],
      invoice_date: [''],
      service_date: [''],
      payment_date: [''],
      description: [''],
      notes: [''],
      poNo: [''],
      lines: this.fb.array([])
    });

    this.rest.getVatPostingGroups().subscribe({
      next: (res: any) => { this.vatPostingGroups = Array.isArray(res) ? res : (res.data || []); }
    });

    // Load full invoice to get all fields including description
    this.rest.getInvoicePreview(this.data.invoice.ID).subscribe({
      next: (res: any) => {
        const inv = res.data || res;
        this.currencyCode = inv.feeCurrency?.code || '';
        this.form.patchValue({
          candidate_first_name: inv.candidate_first_name || '',
          candidate_last_name:  inv.candidate_last_name  || '',
          final_fee_amount:     inv.final_fee_amount ?? '',
          vat_prod_posting_group: inv.vat_prod_posting_group || '0',
          invoice_date:         inv.invoice_date  || '',
          service_date:         inv.service_date  || '',
          payment_date:         inv.payment_date  || '',
          description:          inv.description   || '',
          notes:                inv.notes         || '',
          poNo:                 inv.poNo          || ''
        });
      }
    });
  }

  get linesArray(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  get hasMultipleLines(): boolean {
    return this.linesArray.length > 1;
  }

  get grandTotal(): number {
    if (this.hasMultipleLines) {
      return this.linesArray.controls.reduce((sum, ctrl) => sum + (parseFloat(ctrl.get('final_fee_amount')?.value) || 0), 0);
    }
    return 0;
  }

  submit(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const val = this.form.value;
    const payload: any = {
      invoiceId: this.data.invoice.ID,
      candidate_first_name: val.candidate_first_name || null,
      candidate_last_name: val.candidate_last_name || null,
      final_fee_amount: parseFloat(val.final_fee_amount) || null,
      vat_prod_posting_group: val.vat_prod_posting_group || '0',
      invoice_date: val.invoice_date || null,
      service_date: val.service_date || null,
      payment_date: val.payment_date || null,
      description: val.description || null,
      notes: val.notes || null,
      poNo: val.poNo || null
    };

    if (this.hasMultipleLines) {
      payload.lines = val.lines;
    }

    this.rest.updateRecruitingInvoice(payload).subscribe({
      next: (res: any) => {
        this.dialogService.showSnackBar('Invoice updated', '', 2500);
        this.dialogRef.close(res.data);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }
}
