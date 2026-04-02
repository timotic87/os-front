// complete-recruiting-note-dialog
import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-complete-recruiting-note-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './complete-recruiting-note-dialog.component.html',
})
export class CompleteRecruitingNoteDialogComponent {
  form: FormGroup;
  saving = false;
  noteTypeLabel: string;

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  get currencyCode(): string {
    return this.data.note.feeCurrency?.code || '';
  }

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<CompleteRecruitingNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { note: any; showRefInvoiceNo?: boolean }
  ) {
    this.noteTypeLabel = data.note.noteType === 'credit' ? 'Credit Note' : 'Debit Note';

    const inv = data.note;
    const invoiceDate = inv.invoice_date ? new Date(inv.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const paymentDate = inv.payment_date ? new Date(inv.payment_date).toISOString().split('T')[0] : '';

    const candidateName = `${inv.candidate_first_name || ''} ${inv.candidate_last_name || ''}`.trim();

    this.form = this.fb.group({
      lines: this.fb.array([
        this.fb.group({
          lineNo: [1],
          description: [inv.description || candidateName || 'Fee'],
          quantity: [1, [Validators.required, Validators.min(0.01)]],
          unitPriceExclVAT: [inv.final_fee_amount ?? 0, [Validators.required]],
        })
      ]),
      invoiceDate: [invoiceDate, Validators.required],
      paymentDate: [paymentDate],
      refInvoiceNo: [inv.refInvoiceNo || ''],
      noteComment: [inv.noteComment || ''],
    });
  }

  lineTotal(i: number): number {
    const line = this.lines.at(i).value;
    return (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPriceExclVAT) || 0);
  }

  get grandTotal(): number {
    let total = 0;
    for (let i = 0; i < this.lines.length; i++) total += this.lineTotal(i);
    return total;
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.value;
    this.rest.completeRecruitingNote({
      noteId: this.data.note.ID,
      refInvoiceNo: val.refInvoiceNo || undefined,
      noteComment: val.noteComment || undefined,
      description: val.lines[0]?.description || undefined,
      finalFeeAmount: this.grandTotal,
      invoiceDate: val.invoiceDate || undefined,
      paymentDate: val.paymentDate || undefined,
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.status === 200) {
          this.dialogService.showSnackBar('Data saved', '', 2500);
          this.dialogRef.close({ saved: true });
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }
}
