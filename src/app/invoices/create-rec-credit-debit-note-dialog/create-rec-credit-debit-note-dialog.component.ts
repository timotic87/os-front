import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-create-rec-credit-debit-note-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './create-rec-credit-debit-note-dialog.component.html',
})
export class CreateRecCreditDebitNoteDialogComponent {
  form: FormGroup;
  saving = false;

  get title(): string {
    return this.data.noteType === 'credit' ? 'Create Credit Note' : 'Create Debit Note';
  }

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<CreateRecCreditDebitNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: any; noteType: 'credit' | 'debit' }
  ) {
    this.form = this.fb.group({
      finalFeeAmount: [data.invoice.final_fee_amount || 0, [Validators.required, Validators.min(0)]],
      refInvoiceNo: [''],
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.rest.createRecruitingCreditDebitNote({
      sourceInvoiceId: this.data.invoice.ID,
      noteType: this.data.noteType,
      finalFeeAmount: this.form.value.finalFeeAmount,
      refInvoiceNo: this.form.value.refInvoiceNo || null,
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.status === 200) {
          const label = this.data.noteType === 'credit' ? 'Credit Note' : 'Debit Note';
          this.dialogService.showSnackBar(`${label} RI-${res.data?.ID || ''} created`, '', 3000);
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
