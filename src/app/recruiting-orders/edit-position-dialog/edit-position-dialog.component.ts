import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { UserService } from '../../services/user.service';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { LabelComponent } from '../../shared/components/ui/label/label.component';
import { TextareaComponent } from '../../shared/components/ui/textarea/textarea.component';

@Component({
  selector: 'app-edit-position-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    ButtonComponent,
    InputComponent,
    LabelComponent,
    TextareaComponent
  ],
  templateUrl: './edit-position-dialog.component.html',
  styleUrl: '../../deals/deal/add-position-dialog/add-position-dialog.component.css'
})
export class EditPositionDialogComponent implements OnInit {

  positionForm!: FormGroup;
  salaryTypes: any[] = [];
  currencies: any[] = [];
  feeTypes: any[] = [];
  extraFeeTypes: any[] = [];
  costCenters: any[] = [];
  isSubmitting = false;
  hasFeeLockedInvoices = false;
  hasExtraFeeLockedInvoices = false;

  // Locked only if a placement/admin_fee invoice for the position fee has been approved
  private placementFeeLockedFields = [
    'feeTypesId', 'feeAmount', 'feeCurrencyID', 'feePercentage',
    'feeMultiplier', 'feeSalaryType', 'expectedSalary',
    'expectedSalaryType', 'currencyID'
  ];

  // Locked only if an admin_fee or cancel_fee invoice for this position has been approved
  private extraFeeLockedFields = [
    'extraFeeTypeID', 'extraFeeType', 'extraFeeAmount',
    'extraFeeCurrencyID', 'extraFeePercentage', 'extraFeeMultiplier'
  ];

  constructor(
    public dialogRef: MatDialogRef<EditPositionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { position: any, invoices: any[], existingPositions?: any[] },
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.checkFeeLockedInvoices();
    this.loadRelationData();
    this.initForm();
  }

  checkFeeLockedInvoices(): void {
    const invoices = this.data.invoices || [];
    const positionInvoices = invoices.filter(
      (inv: any) => inv.position_id === this.data.position.ID && inv.status === 'approved' && !inv.deleted
    );
    // Placement fee fields lock if there's an approved placement invoice
    this.hasFeeLockedInvoices = positionInvoices.some(
      (inv: any) => inv.invoice_type === 'placement'
    );
    // Extra fee fields lock if there's an approved admin_fee or cancel_fee invoice
    this.hasExtraFeeLockedInvoices = positionInvoices.some(
      (inv: any) => inv.invoice_type === 'admin_fee' || inv.invoice_type === 'cancel_fee'
    );
  }

  loadRelationData(): void {
    this.rest.getSalaryTypes().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.salaryTypes = res.data;
        }
      }
    });

    this.rest.getCurrencyList().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.currencies = res.data;
        }
      }
    });

    this.rest.getFeeTypes().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.feeTypes = res.data;
        }
      }
    });

    this.rest.getExtraFeeTypes().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.extraFeeTypes = res.data;
        }
      }
    });

    this.rest.getCostCenters('recruiting').subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.costCenters = res.data;
        }
      }
    });
  }

  initForm(): void {
    const pos = this.data.position;

    // Determine extra fee type string
    let extraFeeType = 'fixed';
    if (pos.extra_fee_calculation_type === 1) extraFeeType = 'percentage';
    else if (pos.extra_fee_calculation_type === 2) extraFeeType = 'multiplier';
    else if (pos.extra_fee_calculation_type === 3) extraFeeType = 'fixed';

    this.positionForm = this.fb.group({
      costCenterID: [pos.cost_center_id || '', Validators.required],
      jobTitle: [pos.position_name || '', Validators.required],
      location: [pos.location || '', Validators.required],
      numberOfPeople: [pos.number_of_people || 1, [Validators.required, Validators.min(1)]],
      expectedSalary: [pos.expected_salary || '', [Validators.required, Validators.min(0)]],
      expectedSalaryType: [pos.expected_salary_type_id ? String(pos.expected_salary_type_id) : '', Validators.required],
      currencyID: [pos.expected_salary_currency_id || '', Validators.required],
      feeTypesId: [pos.fee_types_id ? String(pos.fee_types_id) : '', Validators.required],
      feeAmount: [pos.fee_amount || null],
      feeCurrencyID: [pos.fee_currency_id || null],
      feePercentage: [pos.fee_percentage || null],
      feeMultiplier: [pos.fee_multiplier || null],
      feeSalaryType: [pos.salary_type_id ? String(pos.salary_type_id) : null],
      extraFeeTypeID: [pos.extra_fee_type_id ? String(pos.extra_fee_type_id) : null],
      extraFeeType: [extraFeeType],
      extraFeeAmount: [extraFeeType === 'fixed' ? pos.extra_fee_amount : null],
      extraFeeCurrencyID: [pos.extra_fee_currency_id || null],
      extraFeePercentage: [extraFeeType === 'percentage' ? pos.extra_fee_amount : null],
      extraFeeMultiplier: [extraFeeType === 'multiplier' ? pos.extra_fee_amount : null]
    });

    // Apply fee type validators
    this.onFeeTypeChange();

    // Disable placement fee/salary fields only if an approved placement invoice exists
    if (this.hasFeeLockedInvoices) {
      this.placementFeeLockedFields.forEach(field => {
        this.positionForm.get(field)?.disable();
      });
    }
    // Disable extra fee fields only if an approved admin/cancel fee invoice exists
    if (this.hasExtraFeeLockedInvoices) {
      this.extraFeeLockedFields.forEach(field => {
        this.positionForm.get(field)?.disable();
      });
    }
  }

  onFeeTypeChange(): void {
    const feeTypeID = this.positionForm.get('feeTypesId')?.value;
    const feeTypeName = this.getFeeTypeName(feeTypeID)?.toLowerCase();

    const feeAmountControl = this.positionForm.get('feeAmount');
    const feeCurrencyIDControl = this.positionForm.get('feeCurrencyID');
    const feePercentageControl = this.positionForm.get('feePercentage');
    const feeMultiplierControl = this.positionForm.get('feeMultiplier');
    const feeSalaryTypeControl = this.positionForm.get('feeSalaryType');

    feeAmountControl?.clearValidators();
    feeCurrencyIDControl?.clearValidators();
    feePercentageControl?.clearValidators();
    feeMultiplierControl?.clearValidators();
    feeSalaryTypeControl?.clearValidators();

    if (feeTypeName?.includes('fixed')) {
      feeAmountControl?.setValidators([Validators.required, Validators.min(0)]);
      feeCurrencyIDControl?.setValidators([Validators.required]);
    } else if (feeTypeName === 'percentage') {
      feePercentageControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      feeSalaryTypeControl?.setValidators([Validators.required]);
    } else if (feeTypeName === 'multiplier') {
      feeMultiplierControl?.setValidators([Validators.required, Validators.min(0)]);
      feeSalaryTypeControl?.setValidators([Validators.required]);
    }

    feeAmountControl?.updateValueAndValidity();
    feeCurrencyIDControl?.updateValueAndValidity();
    feePercentageControl?.updateValueAndValidity();
    feeMultiplierControl?.updateValueAndValidity();
    feeSalaryTypeControl?.updateValueAndValidity();
  }

  onExtraFeeTypeIDChange(): void {
    const extraFeeTypeID = this.positionForm.get('extraFeeTypeID')?.value;
    if (!extraFeeTypeID || this.getExtraFeeTypeName(extraFeeTypeID) === 'NONE') {
      this.positionForm.patchValue({
        extraFeeType: 'fixed',
        extraFeeAmount: null,
        extraFeeCurrencyID: null,
        extraFeePercentage: null,
        extraFeeMultiplier: null
      });
    }
  }

  onExtraFeeTypeChange(): void {
    this.positionForm.patchValue({
      extraFeeAmount: null,
      extraFeeCurrencyID: null,
      extraFeePercentage: null,
      extraFeeMultiplier: null
    });
  }

  hasError(controlName: string): boolean {
    const control = this.positionForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.positionForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }
    return '';
  }

  getFeeTypeName(feeTypeID: number | string): string {
    if (!this.feeTypes || !feeTypeID) return '';
    const id = typeof feeTypeID === 'string' ? parseInt(feeTypeID, 10) : feeTypeID;
    const feeType = this.feeTypes.find(type => type.ID === id);
    return feeType ? feeType.name : '';
  }

  getExtraFeeTypeName(extraFeeTypeID: number | string): string {
    if (!this.extraFeeTypes || !extraFeeTypeID) return '';
    const id = typeof extraFeeTypeID === 'string' ? parseInt(extraFeeTypeID, 10) : extraFeeTypeID;
    const extraFeeType = this.extraFeeTypes.find(type => type.ID === id);
    return extraFeeType ? extraFeeType.name : '';
  }

  /**
   * Filter extra fee types: ADMIN and CANCEL are mutually exclusive per order.
   * If another position in the order already uses one, the other is hidden.
   * Admins see all types unfiltered.
   */
  getFilteredExtraFeeTypes(): any[] {
    if (!this.extraFeeTypes || this.extraFeeTypes.length === 0) return this.extraFeeTypes;

    // Admin override: show everything
    if (this.userService.can('admin_access')) return this.extraFeeTypes;

    const existingPositions = this.data.existingPositions || [];
    const currentPositionID = Number(this.data.position.ID);
    let lockedType: string | null = null;

    for (const pos of existingPositions) {
      // Skip the current position being edited (compare as numbers to avoid string/int mismatch)
      if (Number(pos.ID) === currentPositionID) continue;
      if (pos.extra_fee_type_id) {
        const efType = this.extraFeeTypes.find(t => Number(t.ID) === Number(pos.extra_fee_type_id));
        if (efType && (efType.name === 'ADMIN' || efType.name === 'CANCEL')) {
          lockedType = efType.name;
          break;
        }
      }
    }

    if (!lockedType) return this.extraFeeTypes;

    const excludeType = lockedType === 'ADMIN' ? 'CANCEL' : 'ADMIN';
    return this.extraFeeTypes.filter(type => type.name !== excludeType);
  }

  onSubmit(): void {
    if (this.positionForm.invalid) {
      this.positionForm.markAllAsTouched();
      this.dialogService.showSnackBar('Please fill in all required fields', null, 3000);
      return;
    }

    this.isSubmitting = true;
    const formValue = this.positionForm.getRawValue();
    const toInt = (v: any) => v === '' || v === null || v === undefined ? null : parseInt(v, 10);
    const toNum = (v: any) => v === '' || v === null || v === undefined ? null : parseFloat(v);

    // Always-editable identity fields (headcount, name, location, cost center)
    const positionData: any = {
      positionID: this.data.position.ID,
      cost_center_id: toInt(formValue.costCenterID),
      position_name: formValue.jobTitle,
      location: formValue.location,
      number_of_people: toInt(formValue.numberOfPeople) || 1
    };

    // Send placement/salary fee fields only if NOT locked (no approved placement invoice)
    if (!this.hasFeeLockedInvoices) {
      positionData.expected_salary = toNum(formValue.expectedSalary);
      positionData.expected_salary_type_id = toInt(formValue.expectedSalaryType);
      positionData.expected_salary_currency_id = toInt(formValue.currencyID);
      positionData.fee_types_id = toInt(formValue.feeTypesId);

      const feeTypeName = this.getFeeTypeName(formValue.feeTypesId)?.toLowerCase();
      if (feeTypeName?.includes('fixed')) {
        positionData.fee_amount = toNum(formValue.feeAmount);
        positionData.fee_currency_id = toInt(formValue.feeCurrencyID);
      } else if (feeTypeName === 'percentage') {
        positionData.fee_percentage = toNum(formValue.feePercentage);
        positionData.salary_type_id = toInt(formValue.feeSalaryType);
      } else if (feeTypeName === 'multiplier') {
        positionData.fee_multiplier = toNum(formValue.feeMultiplier);
        positionData.salary_type_id = toInt(formValue.feeSalaryType);
      }
    }

    // Send extra fee fields only if NOT locked (no approved admin/cancel invoice)
    if (!this.hasExtraFeeLockedInvoices) {
      if (formValue.extraFeeTypeID && this.getExtraFeeTypeName(formValue.extraFeeTypeID) !== 'NONE') {
        positionData.extra_fee_type_id = toInt(formValue.extraFeeTypeID);

        const extraFeeType = formValue.extraFeeType;
        if (extraFeeType === 'fixed') {
          positionData.extra_fee_amount = toNum(formValue.extraFeeAmount);
          positionData.extra_fee_currency_id = toInt(formValue.extraFeeCurrencyID);
          positionData.extra_fee_calculation_type = 3;
        } else if (extraFeeType === 'percentage') {
          positionData.extra_fee_amount = toNum(formValue.extraFeePercentage);
          positionData.extra_fee_calculation_type = 1;
        } else if (extraFeeType === 'multiplier') {
          positionData.extra_fee_amount = toNum(formValue.extraFeeMultiplier);
          positionData.extra_fee_calculation_type = 2;
        }
      } else {
        positionData.extra_fee_type_id = null;
        positionData.extra_fee_amount = null;
        positionData.extra_fee_currency_id = null;
        positionData.extra_fee_calculation_type = null;
      }
    }

    this.rest.updatePosition(positionData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.status === 200) {
          this.dialogService.showSnackBar('Position updated successfully!', null, 3000);
          this.dialogRef.close(res.data);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogService.showMsgDialog('Error updating position: ' + (err.error?.message || err.message));
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
