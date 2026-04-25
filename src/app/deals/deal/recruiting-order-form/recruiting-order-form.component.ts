import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RestService } from '../../../services/rest.service';
import { DialogService } from '../../../services/dialog.service';

// ShadCN UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../../shared/components/ui/card/card.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { LabelComponent } from '../../../shared/components/ui/label/label.component';
import { TextareaComponent } from '../../../shared/components/ui/textarea/textarea.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';


@Component({
  selector: 'app-recruiting-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // ShadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    InputComponent,
    LabelComponent,
    TextareaComponent,
    BadgeComponent
  ],
  templateUrl: './recruiting-order-form.component.html',
  styleUrl: './recruiting-order-form.component.css'
})
export class RecruitingOrderFormComponent implements OnInit, OnChanges {

  @Input() deal: any;
  @Input() isActionsDisabled: boolean = false;
  @Output() orderCreated = new EventEmitter<any>();
  @Output() orderCreating = new EventEmitter<boolean>();

  orderForm!: FormGroup;
  isSubmitting: boolean = false;
  currencies: any[] = [];
  salaryTypes: any[] = [];
  feeTypes: any[] = [];
  extraFeeTypes: any[] = [];
  costCenters: any[] = [];

  // Default values for form fields
  private defaultSalaryTypeID = 1;
  private defaultCurrencyID = 1;
  private defaultFeeTypeID = 1;
  private defaultExtraFeeTypeID = 3; // NONE

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Watch for changes to isActionsDisabled and update form state
   */
  ngOnChanges(changes: any): void {
    if (changes.isActionsDisabled && this.orderForm) {
      this.updateFormDisabledState();
    }
  }

  /**
   * Load all initial data and then initialize form
   */
  private loadInitialData(): void {
    let loadedCount = 0;
    const totalToLoad = 5;

    const checkAndInitialize = () => {
      loadedCount++;
      if (loadedCount === totalToLoad) {
        this.initializeForm();
      }
    };
    this.loadCurrencies(checkAndInitialize);
    this.loadSalaryTypes(checkAndInitialize);
    this.loadFeeTypes(checkAndInitialize);
    this.loadExtraFeeTypes(checkAndInitialize);
    this.loadCostCenters(checkAndInitialize);
  }

  /**
   * Load currencies from backend
   */
  private loadCurrencies(onComplete?: () => void): void {
    this.rest.getCurrencyList().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data && res.data.length > 0) {
          this.currencies = res.data;
          // Set default to first currency BEFORE calling onComplete
          this.defaultCurrencyID = this.currencies[0].ID;
        } else {
          // Fallback to default if no currencies returned
          this.currencies = [{ ID: 1, name: 'RSD', nbsCode: 941 }];
          this.defaultCurrencyID = 1;
        }
        onComplete?.();
      },
      error: (err) => {
        console.error('❌ Error loading currencies:', err);
        // Set default RSD if loading fails
        this.currencies = [{ ID: 1, name: 'RSD', nbsCode: 941 }];
        this.defaultCurrencyID = 1;
        onComplete?.();
      }
    });
  }

  /**
   * Load salary types from backend
   */
  private loadSalaryTypes(onComplete?: () => void): void {
    this.rest.getSalaryTypes().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.salaryTypes = res.data;
        }
        onComplete?.();
      },
      error: (err) => {
        console.error('Error loading salary types:', err);
        // Set default salary types if loading fails
        this.salaryTypes = [
          { ID: 1, name: 'Monthly Gross' },
          { ID: 2, name: 'Monthly Net' },
          { ID: 3, name: 'Yearly Gross' },
          { ID: 4, name: 'Yearly Net' }
        ];
        onComplete?.();
      }
    });
  }

  /**
   * Load fee types from backend
   */
  private loadFeeTypes(onComplete?: () => void): void {
    this.rest.getFeeTypes().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.feeTypes = res.data;
        }
        onComplete?.();
      },
      error: (err) => {
        console.error('Error loading fee types:', err);
        // Set default fee types if loading fails
        this.feeTypes = [
          { ID: 1, name: 'Fixed' },
          { ID: 2, name: 'Percentage' },
          { ID: 3, name: 'Multiplier' }
        ];
        onComplete?.();
      }
    });
  }

  /**
   * Load extra fee types from backend (admin, cancel, etc.)
   */
  private loadExtraFeeTypes(onComplete?: () => void): void {
    this.rest.getExtraFeeTypes().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.extraFeeTypes = res.data;
        }
        onComplete?.();
      },
      error: (err) => {
        console.error('Error loading extra fee types:', err);
        // Set default extra fee types if loading fails
        this.extraFeeTypes = [
          { ID: 1, name: 'Admin Fee' },
          { ID: 2, name: 'Cancellation Fee' }
        ];
        onComplete?.();
      }
    });
  }


  /**
   * Load cost centers from backend
   */
  private loadCostCenters(onComplete?: () => void): void {
    this.rest.getCostCenters('recruiting').subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.costCenters = res.data;
        }
        onComplete?.();
      },
      error: (err) => {
        console.error('Error loading cost centers:', err);
        onComplete?.();
      }
    });
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.orderForm = this.fb.group({
      // Order details
      clientName: [{value: this.deal?.client?.customerName || '', disabled: true}],
      isUmbrella: [false],
      description: [''],
      paymentDueDaysPlacement: [null],
      paymentDueDaysAdditional: [null],

      // Positions array
      positions: this.fb.array([])
    });

    // Add at least one position by default
    this.addPosition();
    
    // Set currency values explicitly after creating positions
    if (this.positions.length > 0 && this.defaultCurrencyID) {
      this.positions.controls.forEach((position, index) => {
        position.patchValue({
          currencyID: this.defaultCurrencyID,
          feeCurrencyID: this.defaultCurrencyID,
          extraFeeCurrencyID: this.defaultCurrencyID
        });
      });
    }

    // Set initial disabled state
    this.updateFormDisabledState();
  }

  /**
   * Update the disabled state of all form controls based on isActionsDisabled
   */
  private updateFormDisabledState(): void {
    if (!this.orderForm) return;

    const controls = ['isUmbrella', 'description', 'paymentDueDaysPlacement', 'paymentDueDaysAdditional'];

    controls.forEach(controlName => {
      const control = this.orderForm.get(controlName);
      if (this.isActionsDisabled) {
        control?.disable();
      } else {
        control?.enable();
      }
    });

    // Update position controls
    this.positions.controls.forEach(position => {
      this.updatePositionDisabledState(position as FormGroup);
    });
  }

  /**
   * Update the disabled state of a single position form group
   */
  private updatePositionDisabledState(positionForm: FormGroup): void {
    const positionControls = [
      'costCenterID', 'jobTitle', 'location', 'numberOfPeople', 'expectedSalary', 'expectedSalaryType', 'currencyID',
      'feeTypesId', 'feeAmount', 'feeCurrencyID', 'feePercentage', 'feeMultiplier', 'feeSalaryType',
      'extraFeeTypeID', 'extraFeeType', 'extraFeeAmount', 'extraFeeCurrencyID',
      'extraFeePercentage', 'extraFeeMultiplier', 'notes'
    ];

    positionControls.forEach(controlName => {
      const control = positionForm.get(controlName);
      if (this.isActionsDisabled) {
        control?.disable();
      } else {
        control?.enable();
      }
    });
  }

  /**
   * Get positions FormArray
   */
  get positions(): FormArray {
    return this.orderForm?.get('positions') as FormArray;
  }

  /**
   * Check if basic order form (without positions) is valid
   */
  get isBasicFormValid(): boolean {
    if (!this.orderForm) return false;
    return true;
  }

  /**
   * Check if all positions are valid
   */
  get areAllPositionsValid(): boolean {
    if (!this.orderForm || !this.positions || this.positions.length === 0) return false;

    const allValid = this.positions.controls.every((position, index) => {
      if (!position.valid) {
        const positionGroup = position as FormGroup;
        // console.log(`Position ${index + 1} is invalid:`, {
        //   errors: position.errors,
        //   value: position.value,
        //   controls: Object.keys(positionGroup.controls).map(key => ({
        //     key,
        //     valid: position.get(key)?.valid,
        //     errors: position.get(key)?.errors,
        //     value: position.get(key)?.value
        //   }))
        // });
      }
      return position.valid;
    });

    return allValid;
  }

  /**
   * Check if entire form (basic form + all positions) is valid
   */
  get isEntireFormValid(): boolean {
    if (!this.orderForm) return false;
    return this.isBasicFormValid && this.areAllPositionsValid;
  }

  /**
   * Get extra fee type name by ID
   */
  getExtraFeeTypeName(extraFeeTypeID: number | string): string {
    if (!this.extraFeeTypes || !extraFeeTypeID) return '';
    // Convert to number if string
    const id = typeof extraFeeTypeID === 'string' ? parseInt(extraFeeTypeID, 10) : extraFeeTypeID;
    const extraFeeType = this.extraFeeTypes.find(type => type.ID === id);
    return extraFeeType ? extraFeeType.name : '';
  }

  /**
   * Get filtered extra fee types for a position.
   * ADMIN and CANCEL are mutually exclusive across all positions in the order.
   * If any position has ADMIN selected, CANCEL is hidden for all positions (and vice versa).
   */
  getFilteredExtraFeeTypes(positionIndex: number): any[] {
    if (!this.extraFeeTypes || this.extraFeeTypes.length === 0) return this.extraFeeTypes;

    // Check what other positions have selected
    let lockedType: string | null = null;
    for (let i = 0; i < this.positions.length; i++) {
      const pos = this.positions.at(i);
      const extraFeeTypeID = pos.get('extraFeeTypeID')?.value;
      if (extraFeeTypeID) {
        const name = this.getExtraFeeTypeName(extraFeeTypeID);
        if (name === 'ADMIN' || name === 'CANCEL') {
          lockedType = name;
          break;
        }
      }
    }

    if (!lockedType) return this.extraFeeTypes;

    // Filter: keep NONE + the locked type, exclude the opposite
    const excludeType = lockedType === 'ADMIN' ? 'CANCEL' : 'ADMIN';
    return this.extraFeeTypes.filter(type => type.name !== excludeType);
  }


  /**
   * Create a new position FormGroup
   */
  private createPositionForm(): FormGroup {
    return this.fb.group({
      costCenterID: ['', [Validators.required]],
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      location: ['', [Validators.required, Validators.minLength(2)]],
      numberOfPeople: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      expectedSalary: [0, [Validators.required, Validators.min(0)]],
      expectedSalaryType: [this.defaultSalaryTypeID, [Validators.required]],
      currencyID: [this.defaultCurrencyID, [Validators.required]],
      feeTypesId: [this.defaultFeeTypeID, [Validators.required]],
      feeAmount: [0], // Validators set dynamically based on fee type
      feeCurrencyID: [this.defaultCurrencyID], // Validators set dynamically based on fee type
      feePercentage: [null],
      feeMultiplier: [null],
      feeSalaryType: [this.defaultSalaryTypeID],
      extraFeeTypeID: [this.defaultExtraFeeTypeID],
      extraFeeType: ['fixed'],
      extraFeeAmount: [0],
      extraFeeCurrencyID: [this.defaultCurrencyID],
      extraFeePercentage: [null],
      extraFeeMultiplier: [null],
      notes: ['']
    });
  }


  /**
   * Add new position to the form
   */
  addPosition(): void {
    const positionForm = this.createPositionForm();
    this.positions.push(positionForm);
    
    // Set currency IDs explicitly if available
    if (this.defaultCurrencyID) {
      positionForm.patchValue({
        currencyID: this.defaultCurrencyID,
        feeCurrencyID: this.defaultCurrencyID,
        extraFeeCurrencyID: this.defaultCurrencyID
      });
    }

    // Apply disabled state to the new position
    this.updatePositionDisabledState(positionForm);

    // Initialize validators based on default fee type
    const positionIndex = this.positions.length - 1;
    this.onFeeTypeChange(positionIndex, this.defaultFeeTypeID);
  }

  /**
   * Remove position from the form
   */
  removePosition(index: number): void {
    if (this.positions.length > 1) { // Keep at least one position
      this.positions.removeAt(index);
    } else {
      this.dialogService.showSnackBar('At least one position is required', '', 2500);
    }
  }

  /**
   * Get fee type name by ID
   */
  getFeeTypeName(feeTypeID: number | string): string {
    if (!this.feeTypes || !feeTypeID) return '';
    // Convert to number if string
    const id = typeof feeTypeID === 'string' ? parseInt(feeTypeID, 10) : feeTypeID;
    const feeType = this.feeTypes.find(type => type.ID === id);
    return feeType ? feeType.name : '';
  }

  /**
   * Handle fee type change for a position
   */
  onFeeTypeChange(positionIndex: number, feeTypeID: any): void {
    const position = this.positions.at(positionIndex);
    
    // Parse the ID - Angular select with [ngValue] may return 'index: value' string
    let parsedID: number;
    if (typeof feeTypeID === 'string' && feeTypeID.includes(':')) {
      // Extract value after colon: '0: 1' -> 1
      parsedID = parseInt(feeTypeID.split(':')[1].trim(), 10);
    } else {
      parsedID = typeof feeTypeID === 'string' ? parseInt(feeTypeID, 10) : feeTypeID;
    }
    
    const feeTypeName = this.getFeeTypeName(parsedID).toLowerCase();
    
    // Reset fee-related fields (but keep currency values)
    position.patchValue({
      feeAmount: null,
      feePercentage: null,
      feeMultiplier: null
      // Do NOT reset feeCurrencyID here - it should retain its value
    });

    // Update validators based on fee type
    const feeAmountControl = position.get('feeAmount');
    const feeCurrencyIDControl = position.get('feeCurrencyID');
    const feePercentageControl = position.get('feePercentage');
    const feeMultiplierControl = position.get('feeMultiplier');

    // Clear all validators first
    feeAmountControl?.clearValidators();
    feeCurrencyIDControl?.clearValidators();
    feePercentageControl?.clearValidators();
    feeMultiplierControl?.clearValidators();

    // Add appropriate validators based on fee type
    if (feeTypeName.includes('fixed')) {
      feeAmountControl?.setValidators([Validators.required, Validators.min(0)]);
      feeCurrencyIDControl?.setValidators([Validators.required]);
      // Ensure currency value is set if not already
      if (!feeCurrencyIDControl?.value && this.defaultCurrencyID) {
        position.patchValue({ feeCurrencyID: this.defaultCurrencyID });
      }
    } else if (feeTypeName.includes('percentage')) {
      feePercentageControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else if (feeTypeName.includes('multiplier')) {
      feeMultiplierControl?.setValidators([Validators.required, Validators.min(0)]);
    }

    // Update validity
    feeAmountControl?.updateValueAndValidity();
    feeCurrencyIDControl?.updateValueAndValidity();
    feePercentageControl?.updateValueAndValidity();
    feeMultiplierControl?.updateValueAndValidity();
  }

  /**
   * Handle extra fee type ID change (admin, cancel, none, etc.)
   */
  onExtraFeeTypeIDChange(positionIndex: number, extraFeeTypeID: any): void {
    const position = this.positions.at(positionIndex);
    
    // Parse the ID - Angular select with [ngValue] may return 'index: value' string
    let parsedID: number;
    if (typeof extraFeeTypeID === 'string' && extraFeeTypeID.includes(':')) {
      // Extract value after colon: '0: 1' -> 1
      parsedID = parseInt(extraFeeTypeID.split(':')[1].trim(), 10);
    } else {
      parsedID = typeof extraFeeTypeID === 'string' ? parseInt(extraFeeTypeID, 10) : extraFeeTypeID;
    }
    
    const extraFeeTypeName = this.getExtraFeeTypeName(parsedID);

    // If NONE is selected, clear all extra fee fields and remove validators
    if (extraFeeTypeName === 'NONE') {

      position.patchValue({
        extraFeeType: 'fixed',
        extraFeeAmount: null,
        extraFeePercentage: null,
        extraFeeMultiplier: null,
        extraFeeCurrencyID: this.defaultCurrencyID
      });

      // Clear validators for extra fee fields
      const extraFeeAmountControl = position.get('extraFeeAmount');
      const extraFeePercentageControl = position.get('extraFeePercentage');
      const extraFeeMultiplierControl = position.get('extraFeeMultiplier');
      const extraFeeCurrencyIDControl = position.get('extraFeeCurrencyID');

      extraFeeAmountControl?.clearValidators();
      extraFeePercentageControl?.clearValidators();
      extraFeeMultiplierControl?.clearValidators();
      extraFeeCurrencyIDControl?.clearValidators();

      extraFeeAmountControl?.updateValueAndValidity();
      extraFeePercentageControl?.updateValueAndValidity();
      extraFeeMultiplierControl?.updateValueAndValidity();
      extraFeeCurrencyIDControl?.updateValueAndValidity();
    }
  }

  /**
   * Handle extra fee type change for a position
   */
  onExtraFeeTypeChange(positionIndex: number, feeType: string): void {
    const position = this.positions.at(positionIndex);

    // Reset extra fee-related fields
    position.patchValue({
      extraFeeAmount: null,
      extraFeePercentage: null,
      extraFeeMultiplier: null
    });

    // Update validators based on extra fee type
    const extraFeeAmountControl = position.get('extraFeeAmount');
    const extraFeePercentageControl = position.get('extraFeePercentage');
    const extraFeeMultiplierControl = position.get('extraFeeMultiplier');

    // Clear all validators first
    extraFeeAmountControl?.clearValidators();
    extraFeePercentageControl?.clearValidators();
    extraFeeMultiplierControl?.clearValidators();

    // Add appropriate validators based on extra fee type
    if (feeType === 'fixed') {
      extraFeeAmountControl?.setValidators([Validators.min(0)]);
    } else if (feeType === 'percentage') {
      extraFeePercentageControl?.setValidators([Validators.min(0), Validators.max(100)]);
    } else if (feeType === 'multiplier') {
      extraFeeMultiplierControl?.setValidators([Validators.min(0)]);
    }

    // Update validity
    extraFeeAmountControl?.updateValueAndValidity();
    extraFeePercentageControl?.updateValueAndValidity();
    extraFeeMultiplierControl?.updateValueAndValidity();
  }


  /**
   * Submit the form to create recruiting order
   */
  onSubmit(): void {
    this.orderForm.markAllAsTouched();
    if (this.orderForm.valid && !this.isActionsDisabled && !this.isSubmitting) {
      this.isSubmitting = true;
      this.orderCreating.emit(true);

      const formData = this.prepareFormData();

      this.rest.createRecruitingOrder(formData).subscribe({
        next: (res) => {
          if (res.status === 200 || res.status === 201) {
            this.orderCreated.emit(res.data.recruitingOrder);
            this.orderCreating.emit(false);
            this.isSubmitting = false;
            this.dialogService.showSnackBar(`Recruiting order created with ${res.data.positions?.length || 0} position(s)!`, '', 3000);
          }
        },
        error: (err) => {
          console.error('Error creating recruiting order:', err);
          this.dialogService.showMsgDialog('Error creating recruiting order: ' + (err.error?.message || err.message));
          this.isSubmitting = false;
          this.orderCreating.emit(false);
        }
      });
    } else {
      this.markFormGroupTouched(this.orderForm);
      this.dialogService.showSnackBar('Please fill in all required fields', '', 2500);
    }
  }

  /**
   * Prepare form data for API submission
   */
  private prepareFormData(): any {
    const formValue = this.orderForm.value;
    
    return {
      dealID: this.deal.ID,
      isUmbrella: formValue.isUmbrella || false,
      clientName: this.deal?.client?.customerName || '',
      description: formValue.description,
      payment_due_days_placement: formValue.paymentDueDaysPlacement || null,
      payment_due_days_additional: formValue.paymentDueDaysAdditional || null,
      positions: formValue.positions.map((pos: any) => {
        const extraFeeTypeName = this.getExtraFeeTypeName(pos.extraFeeTypeID);
        const isExtraFeeNone = extraFeeTypeName === 'NONE';
        const feeTypeName = this.getFeeTypeName(pos.feeTypesId).toLowerCase();

        // Helper to convert string to number or null
        const toNumber = (val: any) => {
          if (val === null || val === undefined || val === '' || val === 'undefined') return null;
          const num = typeof val === 'string' ? parseFloat(val) : val;
          return isNaN(num) ? null : num;
        };

        // Map extra fee fields
        let extraFeeAmountValue = null;
        let extraFeeCalculationType = null;
        if (!isExtraFeeNone) {
          if (pos.extraFeeType === 'fixed') {
            extraFeeAmountValue = toNumber(pos.extraFeeAmount);
            extraFeeCalculationType = 3; // Fixed
          } else if (pos.extraFeeType === 'percentage') {
            extraFeeAmountValue = toNumber(pos.extraFeePercentage);
            extraFeeCalculationType = 1; // Percentage
          } else if (pos.extraFeeType === 'multiplier') {
            extraFeeAmountValue = toNumber(pos.extraFeeMultiplier);
            extraFeeCalculationType = 2; // Multiplier
          }
        }

        return {
          costCenterID: toNumber(pos.costCenterID),
          jobTitle: pos.jobTitle,
          location: pos.location,
          numberOfPeople: toNumber(pos.numberOfPeople) || 1,
          expectedSalary: toNumber(pos.expectedSalary),
          expectedSalaryType: toNumber(pos.expectedSalaryType),
          currencyID: toNumber(pos.currencyID),
          feeTypesId: toNumber(pos.feeTypesId),
          feeAmount: feeTypeName.includes('fixed') ? toNumber(pos.feeAmount) : null,
          feeCurrencyID: feeTypeName.includes('fixed') ? toNumber(pos.feeCurrencyID) : null,
          feePercentage: feeTypeName.includes('percentage') ? toNumber(pos.feePercentage) : null,
          feeMultiplier: feeTypeName.includes('multiplier') ? toNumber(pos.feeMultiplier) : null,
          salary_type_id: (feeTypeName === 'percentage' || feeTypeName === 'multiplier') ? toNumber(pos.feeSalaryType) : null,
          extraFeeTypeID: toNumber(pos.extraFeeTypeID),
          extraFeeAmount: extraFeeAmountValue,
          extraFeeCurrencyID: (!isExtraFeeNone && pos.extraFeeType === 'fixed') ? toNumber(pos.extraFeeCurrencyID) : null,
          extraFeeCalculationType: extraFeeCalculationType,
          notes: pos.notes
        };
      })
    };
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  /**
   * Check if a form control has an error and is touched
   */
  hasError(controlName: string, positionIndex?: number): boolean {
    if (positionIndex !== undefined) {
      const position = this.positions.at(positionIndex);
      const control = position.get(controlName);
      return !!(control?.invalid && control?.touched);
    } else {
      const control = this.orderForm.get(controlName);
      return !!(control?.invalid && control?.touched);
    }
  }

  /**
   * Get error message for a control
   */
  getErrorMessage(controlName: string, positionIndex?: number): string {
    let control;
    if (positionIndex !== undefined) {
      const position = this.positions.at(positionIndex);
      control = position.get(controlName);
    } else {
      control = this.orderForm.get(controlName);
    }

    if (control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['minlength']) return `Minimum length is ${control.errors['minlength'].requiredLength}`;
      if (control.errors['maxlength']) return `Maximum length is ${control.errors['maxlength'].requiredLength}`;
      if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
      if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;
    }
    return '';
  }
}
