import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-complete-note-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './complete-note-dialog.component.html',
})
export class CompleteNoteDialogComponent {
  form: FormGroup;
  saving = false;
  noteTypeLabel: string;

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  get currencyCode(): string {
    return this.data.note.currencyCode || '';
  }

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<CompleteNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { note: any }
  ) {
    this.noteTypeLabel = data.note.noteType === 'credit' ? 'Credit Note' : 'Debit Note';

    const sourceLinesArr = (data.note.lines || []).map((l: any) =>
      this.fb.group({
        lineNo: [l.lineNo],
        description: [l.description || ''],
        quantity: [l.quantity || 1, [Validators.required, Validators.min(0.01)]],
        unitPriceExclVAT: [l.unitPriceExclVAT || 0, [Validators.required]],
      })
    );

    this.form = this.fb.group({
      refInvoiceNo: [data.note.refInvoiceNo || ''],
      noteComment: [data.note.noteComment || ''],
      lines: this.fb.array(sourceLinesArr),
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
    this.saving = true;
    const val = this.form.value;
    this.rest.completeSalesNote({
      noteId: this.data.note.id,
      refInvoiceNo: val.refInvoiceNo || undefined,
      noteComment: val.noteComment || undefined,
      lines: val.lines,
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
