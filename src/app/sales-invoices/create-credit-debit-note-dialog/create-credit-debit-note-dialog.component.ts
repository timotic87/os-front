import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-create-credit-debit-note-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './create-credit-debit-note-dialog.component.html',
})
export class CreateCreditDebitNoteDialogComponent {
  form: FormGroup;
  saving = false;
  markAsReady = false;

  get title(): string {
    return this.data.noteType === 'credit' ? 'Create Credit Note' : 'Create Debit Note';
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  get calculatedDueDate(): string {
    const issueDate = this.form.get('issueDate')?.value;
    const days = this.form.get('paymentDueDays')?.value;
    if (!issueDate || !days) return '';
    const d = new Date(issueDate);
    d.setDate(d.getDate() + parseInt(days));
    return d.toISOString().split('T')[0];
  }

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<CreateCreditDebitNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: any; noteType: 'credit' | 'debit'; invoiceType?: 'sales' | 'recruiting' }
  ) {
    const today = new Date().toISOString().split('T')[0];
    const inv = data.invoice;

    const sourceLinesArr = (inv.lines || []).map((l: any) =>
      this.fb.group({
        lineNo: [l.lineNo],
        description: [l.description || ''],
        quantity: [l.quantity || 1, [Validators.required, Validators.min(0.01)]],
        unitPriceExclVAT: [l.unitPriceExclVAT || 0, [Validators.required]],
      })
    );

    this.form = this.fb.group({
      issueDate: [today, Validators.required],
      transactionDate: [today, Validators.required],
      paymentDueDays: [inv.paymentDueDays || 30, [Validators.required, Validators.min(0)]],
      lines: this.fb.array(sourceLinesArr),
    });
  }

  get isRecruiting(): boolean {
    return this.data.invoiceType === 'recruiting';
  }

  get currencyCode(): string {
    return this.isRecruiting
      ? (this.data.invoice.feeCurrency?.code || '')
      : (this.data.invoice.currencyCode || '');
  }

  lineTotal(i: number): number {
    const line = this.lines.at(i).value;
    return (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPriceExclVAT) || 0);
  }

  get grandTotal(): number {
    let total = 0;
    for (let i = 0; i < this.lines.length; i++) {
      total += this.lineTotal(i);
    }
    return total;
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.value;
    const label = this.data.noteType === 'credit' ? 'Credit Note' : 'Debit Note';

    if (this.isRecruiting) {
      const totalAmount = this.grandTotal;
      this.rest.createRecruitingCreditDebitNote({
        sourceInvoiceId: this.data.invoice.ID,
        noteType: this.data.noteType,
        finalFeeAmount: totalAmount,
        issueDate: val.issueDate,
        transactionDate: val.transactionDate,
        paymentDueDays: val.paymentDueDays,
      }).subscribe({
        next: (res: any) => {
          this.saving = false;
          if (res.status === 200) {
            this.dialogService.showSnackBar(`${label} RI-${res.data?.ID || ''} created`, '', 3000);
            this.dialogRef.close({ created: true, note: res.data });
          }
        },
        error: (err: any) => {
          this.saving = false;
          this.dialogService.errorServDialog(err);
        }
      });
    } else {
      this.rest.createSalesCreditDebitNote({
        sourceInvoiceId: this.data.invoice.id,
        noteType: this.data.noteType,
        lines: val.lines,
        createAsReady: this.markAsReady,
        issueDate: val.issueDate,
        transactionDate: val.transactionDate,
        paymentDueDays: val.paymentDueDays,
      }).subscribe({
        next: (res: any) => {
          this.saving = false;
          if (res.status === 200) {
            const status = this.markAsReady ? 'ready' : 'draft';
            this.dialogService.showSnackBar(`${label} ${res.data?.invoiceNo || ''} created (${status})`, '', 3000);
            this.dialogRef.close({ created: true, note: res.data });
          }
        },
        error: (err: any) => {
          this.saving = false;
          this.dialogService.errorServDialog(err);
        }
      });
    }
  }
}
