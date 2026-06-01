import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../../services/rest.service';
import { DialogService } from '../../../services/dialog.service';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { LabelComponent } from '../../../shared/components/ui/label/label.component';
import { TextareaComponent } from '../../../shared/components/ui/textarea/textarea.component';

@Component({
  selector: 'app-add-position-dialog',
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
  templateUrl: './add-position-dialog.component.html',
  styleUrl: './add-position-dialog.component.css'
})
export class AddPositionDialogComponent implements OnInit {
  
  positionForm!: FormGroup;
  salaryTypes: any[] = [];
  currencies: any[] = [];
  feeTypes: any[] = [];
  extraFeeTypes: any[] = [];
  costCenters: any[] = [];
  isSubmitting = false;

  // Defaults applied once lookups load (mirrors recruiting-order-form behaviour)
  private defaultSalaryTypeID = 1;
  private defaultCurrencyID = 1;
  private defaultFeeTypeID = 1;
  private defaultExtraFeeTypeID = 3; // NONE
  
  constructor(
    public dialogRef: MatDialogRef<AddPositionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderID: number, existingPositions?: any[] },
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadRelationData();
    this.initForm();
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
          if (this.currencies.length > 0) {
            this.defaultCurrencyID = this.currencies[0].ID;
            this.applyDefaults();
          }
        }
      }
    });

    this.rest.getFeeTypes().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.feeTypes = res.data;
          if (this.feeTypes.length > 0) {
            this.defaultFeeTypeID = this.feeTypes[0].ID;
            this.applyDefaults();
          }
        }
      }
    });

    this.rest.getExtraFeeTypes().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.extraFeeTypes = res.data;
          const none = this.extraFeeTypes.find((t: any) => t.name === 'NONE');
          if (none) this.defaultExtraFeeTypeID = none.ID;
          this.applyDefaults();
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
    this.positionForm = this.fb.group({
      costCenterID: ['', Validators.required],
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      location: ['', [Validators.required, Validators.minLength(2)]],
      numberOfPeople: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      expectedSalary: [0, [Validators.required, Validators.min(0)]],
      expectedSalaryType: [this.defaultSalaryTypeID, Validators.required],
      currencyID: [this.defaultCurrencyID, Validators.required],
      feeTypesId: [this.defaultFeeTypeID, Validators.required],
      feeAmount: [0],
      feeCurrencyID: [this.defaultCurrencyID],
      feePercentage: [null],
      feeMultiplier: [null],
      feeSalaryType: [this.defaultSalaryTypeID],
      extraFeeTypeID: [this.defaultExtraFeeTypeID],
      extraFeeType: ['fixed'],
      extraFeeAmount: [0],
      extraFeeCurrencyID: [this.defaultCurrencyID],
      extraFeePercentage: [null],
      extraFeeMultiplier: [null],
      initialComment: ['']
    });
    // Initialize dynamic validators for the default fee type so the form is valid out of the box
    this.onFeeTypeChange();
  }

  /**
   * Re-apply defaults to the form once lookup data finishes loading.
   * Only overrides fields if user has not touched them yet (still equal to the previous initial value).
   */
  private applyDefaults(): void {
    if (!this.positionForm) return;
    const f = this.positionForm;
    const setIfUntouched = (control: string, value: any) => {
      const c = f.get(control);
      if (!c) return;
      // patch if value is empty/null/0 (initial state) and user hasn't typed anything
      const cur = c.value;
      if (cur === '' || cur === null || cur === 0 || cur === this.defaultSalaryTypeID || cur === this.defaultCurrencyID || cur === this.defaultFeeTypeID || cur === this.defaultExtraFeeTypeID) {
        c.setValue(value, { emitEvent: false });
      }
    };
    setIfUntouched('expectedSalaryType', this.defaultSalaryTypeID);
    setIfUntouched('currencyID', this.defaultCurrencyID);
    setIfUntouched('feeTypesId', this.defaultFeeTypeID);
    setIfUntouched('feeCurrencyID', this.defaultCurrencyID);
    setIfUntouched('feeSalaryType', this.defaultSalaryTypeID);
    setIfUntouched('extraFeeTypeID', this.defaultExtraFeeTypeID);
    setIfUntouched('extraFeeCurrencyID', this.defaultCurrencyID);
    this.onFeeTypeChange();
  }

  onFeeTypeChange(): void {
    const feeTypeID = this.positionForm.get('feeTypesId')?.value;
    const feeTypeName = this.getFeeTypeName(feeTypeID)?.toLowerCase();
    
    const feeAmountControl = this.positionForm.get('feeAmount');
    const feeCurrencyIDControl = this.positionForm.get('feeCurrencyID');
    const feePercentageControl = this.positionForm.get('feePercentage');
    const feeMultiplierControl = this.positionForm.get('feeMultiplier');
    const feeSalaryTypeControl = this.positionForm.get('feeSalaryType');

    // Clear all validators first
    feeAmountControl?.clearValidators();
    feeCurrencyIDControl?.clearValidators();
    feePercentageControl?.clearValidators();
    feeMultiplierControl?.clearValidators();
    feeSalaryTypeControl?.clearValidators();

    // Reset values
    this.positionForm.patchValue({
      feeAmount: null,
      feeCurrencyID: null,
      feePercentage: null,
      feeMultiplier: null
    });

    // Add appropriate validators based on fee type
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

    // Update validity
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
    // Reset extra fee values when type changes
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
   * Filter extra fee types: ADMIN and CANCEL are mutually exclusive.
   * If existing positions in the order already use ADMIN, hide CANCEL (and vice versa).
   */
  getFilteredExtraFeeTypes(): any[] {
    if (!this.extraFeeTypes || this.extraFeeTypes.length === 0) return this.extraFeeTypes;

    const existingPositions = this.data.existingPositions || [];
    let lockedType: string | null = null;

    for (const pos of existingPositions) {
      if (pos.extra_fee_type_id) {
        const efType = this.extraFeeTypes.find(t => t.ID === pos.extra_fee_type_id);
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
    const formValue = this.positionForm.value;

    const positionData: any = {
      order_id: this.data.orderID,
      cost_center_id: formValue.costCenterID || null,
      position_name: formValue.jobTitle,
      location: formValue.location,
      number_of_people: formValue.numberOfPeople || 1,
      expected_salary: formValue.expectedSalary,
      expected_salary_type_id: formValue.expectedSalaryType,
      expected_salary_currency_id: formValue.currencyID,
      fee_types_id: formValue.feeTypesId,
      initialComment: formValue.initialComment || null
    };

    // Add fee-related fields based on fee type
    const feeTypeName = this.getFeeTypeName(formValue.feeTypesId)?.toLowerCase();
    if (feeTypeName?.includes('fixed')) {
      positionData.fee_amount = formValue.feeAmount;
      positionData.fee_currency_id = formValue.feeCurrencyID;
    } else if (feeTypeName === 'percentage') {
      positionData.fee_percentage = formValue.feePercentage;
      positionData.salary_type_id = formValue.feeSalaryType;
    } else if (feeTypeName === 'multiplier') {
      positionData.fee_multiplier = formValue.feeMultiplier;
      positionData.salary_type_id = formValue.feeSalaryType;
    }

    // Add extra fee if selected
    if (formValue.extraFeeTypeID && this.getExtraFeeTypeName(formValue.extraFeeTypeID) !== 'NONE') {
      positionData.extra_fee_type_id = formValue.extraFeeTypeID;
      
      const extraFeeType = formValue.extraFeeType;
      if (extraFeeType === 'fixed') {
        positionData.extra_fee_amount = formValue.extraFeeAmount;
        positionData.extra_fee_currency_id = formValue.extraFeeCurrencyID;
        positionData.extra_fee_calculation_type = 3; // Fixed
      } else if (extraFeeType === 'percentage') {
        positionData.extra_fee_amount = formValue.extraFeePercentage;
        positionData.extra_fee_calculation_type = 1; // Percentage
      } else if (extraFeeType === 'multiplier') {
        positionData.extra_fee_amount = formValue.extraFeeMultiplier;
        positionData.extra_fee_calculation_type = 2; // Multiplier
      }
    }

    this.rest.createPosition(positionData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.status === 200 || res.status === 201) {
          this.dialogService.showSnackBar('Position added successfully!', null, 3000);
          this.dialogRef.close(res.data);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogService.showMsgDialog('Error adding position: ' + (err.error?.message || err.message));
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
