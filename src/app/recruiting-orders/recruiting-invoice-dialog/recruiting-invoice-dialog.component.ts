import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { LabelComponent } from '../../shared/components/ui/label/label.component';
import { TextareaComponent } from '../../shared/components/ui/textarea/textarea.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';

export interface InvoiceDialogData {
  mode: 'placement' | 'admin_fee' | 'cancel_fee';
  position: any;
  orderID: number;
}

@Component({
  selector: 'app-recruiting-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    ButtonComponent,
    InputComponent,
    LabelComponent,
    TextareaComponent,
    BadgeComponent
  ],
  templateUrl: './recruiting-invoice-dialog.component.html',
  styleUrl: './recruiting-invoice-dialog.component.css'
})
export class RecruitingInvoiceDialogComponent implements OnInit {

  invoiceForm!: FormGroup;
  salaryTypes: any[] = [];
  currencies: any[] = [];
  isSubmitting = false;
  calculatedFee = 0;
  feeOverridden = false;

  constructor(
    public dialogRef: MatDialogRef<RecruitingInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvoiceDialogData,
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadRelationData();
    this.initForm();
  }

  get mode() { return this.data.mode; }
  get position() { return this.data.position; }

  getTitle(): string {
    switch (this.mode) {
      case 'placement': return 'Close Position (Placement)';
      case 'admin_fee': return 'Admin Fee';
      case 'cancel_fee': return 'Cancel Fee';
      default: return 'Invoice';
    }
  }

  loadRelationData(): void {
    this.rest.getSalaryTypes().subscribe({
      next: (res) => {
        if (res.status === 200) this.salaryTypes = res.data;
      }
    });
    this.rest.getCurrencyList().subscribe({
      next: (res) => {
        if (res.status === 200) this.currencies = res.data;
      }
    });
  }

  initForm(): void {
    const pos = this.position;

    // Pre-fill values based on mode
    let salaryAmount = null;
    let salaryTypeId = pos.salary_type_id || null;
    let salaryCurrencyId = pos.expected_salary_currency_id || pos.fee_currency_id || null;

    if (this.mode === 'admin_fee') {
      salaryAmount = pos.expected_salary || null;
      salaryTypeId = pos.expected_salary_type_id || pos.salary_type_id || null;
      salaryCurrencyId = pos.expected_salary_currency_id || pos.fee_currency_id || null;
    }

    this.invoiceForm = this.fb.group({
      candidate_first_name: [null, this.mode === 'placement' ? Validators.required : []],
      candidate_last_name: [null, this.mode === 'placement' ? Validators.required : []],
      salary_amount: [salaryAmount, Validators.required],
      salary_type_id: [salaryTypeId, Validators.required],
      salary_currency_id: [salaryCurrencyId, Validators.required],
      final_fee_amount: [null, Validators.required],
      fee_currency_id: [pos.fee_currency_id || null, Validators.required],
      notes: [null]
    });

    // Calculate initial fee if salary is pre-filled
    if (salaryAmount) {
      this.recalculateFee();
    }

    // Watch salary changes to recalculate fee
    this.invoiceForm.get('salary_amount')!.valueChanges.subscribe(() => {
      if (!this.feeOverridden) {
        this.recalculateFee();
      }
    });
  }

  recalculateFee(): void {
    const salary = parseFloat(this.invoiceForm.get('salary_amount')!.value) || 0;
    const pos = this.position;

    switch (pos.fee_types_id) {
      case 1: // Percentage
        this.calculatedFee = Math.round(salary * (parseFloat(pos.fee_percentage) || 0) / 100 * 1000) / 1000;
        break;
      case 2: // Multiplier
        this.calculatedFee = Math.round(salary * (parseFloat(pos.fee_multiplier) || 1) * 1000) / 1000;
        break;
      case 3: // Fixed
        this.calculatedFee = parseFloat(pos.fee_amount) || 0;
        break;
      default:
        this.calculatedFee = 0;
    }

    if (!this.feeOverridden) {
      this.invoiceForm.get('final_fee_amount')!.setValue(this.calculatedFee, { emitEvent: false });
    }
  }

  onFeeManualChange(): void {
    const currentFee = parseFloat(this.invoiceForm.get('final_fee_amount')!.value) || 0;
    this.feeOverridden = Math.abs(currentFee - this.calculatedFee) > 0.001;
  }

  resetFee(): void {
    this.feeOverridden = false;
    this.invoiceForm.get('final_fee_amount')!.setValue(this.calculatedFee, { emitEvent: false });
  }

  getFeeConfigLabel(): string {
    const pos = this.position;
    switch (pos.fee_types_id) {
      case 1: return `${pos.fee_percentage}%`;
      case 2: return `${pos.fee_multiplier}x`;
      case 3: return `Fixed: ${pos.fee_amount}`;
      default: return 'N/A';
    }
  }

  hasError(field: string): boolean {
    const control = this.invoiceForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.invoiceForm.get(field);
    if (control?.hasError('required')) return 'This field is required';
    return '';
  }

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    this.invoiceForm.markAllAsTouched();
    if (this.invoiceForm.invalid) return;

    this.isSubmitting = true;
    const formVal = this.invoiceForm.value;

    const payload = {
      order_id: this.data.orderID,
      position_id: this.position.ID,
      invoice_type: this.mode,
      candidate_first_name: formVal.candidate_first_name,
      candidate_last_name: formVal.candidate_last_name,
      salary_amount: formVal.salary_amount,
      salary_type_id: formVal.salary_type_id,
      salary_currency_id: formVal.salary_currency_id,
      final_fee_amount: formVal.final_fee_amount,
      fee_currency_id: formVal.fee_currency_id,
      notes: formVal.notes
    };

    this.rest.createRecruitingInvoice(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.status === 201) {
          this.dialogService.showSnackBar('Invoice created successfully', '', 3000);
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }
}
