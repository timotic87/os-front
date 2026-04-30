// complete-recruiting-note-dialog
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  get currencyCode(): string {
    return this.data.note.feeCurrency?.code || '';
  }

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<CompleteRecruitingNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { note: any }
  ) {
    this.noteTypeLabel = data.note.noteType === 'credit' ? 'Credit Note' : 'Debit Note';

    const inv = data.note;
    const invoiceDate = inv.invoice_date ? new Date(inv.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const paymentDate = inv.payment_date ? new Date(inv.payment_date).toISOString().split('T')[0] : '';
    const candidateName = `${inv.candidate_first_name || ''} ${inv.candidate_last_name || ''}`.trim();

    this.form = this.fb.group({
      finalFeeAmount: [inv.final_fee_amount ?? 0, [Validators.required, Validators.min(0)]],
      description: [inv.description || candidateName || 'Fee'],
      invoiceDate: [invoiceDate, Validators.required],
      paymentDate: [paymentDate],
      refInvoiceNo: [inv.refInvoiceNo || ''],
      noteComment: [inv.noteComment || ''],
      poNo: [inv.poNo || ''],
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.value;
    this.rest.completeRecruitingNote({
      noteId: this.data.note.ID,
      refInvoiceNo: val.refInvoiceNo || undefined,
      noteComment: val.noteComment || undefined,
      description: val.description || undefined,
      finalFeeAmount: val.finalFeeAmount,
      invoiceDate: val.invoiceDate || undefined,
      paymentDate: val.paymentDate || undefined,
      poNo: val.poNo || undefined,
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
