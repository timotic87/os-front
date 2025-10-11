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
  extraFeeTypes: any[] = [];
  
  // Default values for form fields
  private defaultSalaryTypeID = 1;
  private defaultCurrencyID = 1;
  private defaultExtraFeeTypeID = 1;

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 RecruitingOrderFormComponent initialized!');
    console.log('Deal data:', this.deal);
    console.log('Actions disabled:', this.isActionsDisabled);
    
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
    const totalToLoad = 3;
    
    const checkAndInitialize = () => {
      loadedCount++;
      if (loadedCount === totalToLoad) {
        this.initializeForm();
      }
    };
    this.loadCurrencies(checkAndInitialize);
    this.loadSalaryTypes(checkAndInitialize);
    this.loadExtraFeeTypes(checkAndInitialize);
  }
  
  /**
   * Load currencies from backend
   */
  private loadCurrencies(onComplete?: () => void): void {
    this.rest.getCurrencyList().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.currencies = res.data;
        }
        onComplete?.();
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
        // Set default RSD if loading fails
        this.currencies = [{ ID: 1, name: 'RSD', code: 'RSD' }];
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
   * Initialize the reactive form
   */
  private initializeForm(): void {
    // Generate auto order number with timestamp
    const autoOrderNumber = `RO-${Date.now()}`;
    
    this.orderForm = this.fb.group({
      // Order details
      orderNumber: [autoOrderNumber, [Validators.required, Validators.minLength(1)]],
      clientName: [{value: this.deal?.client?.name || '', disabled: true}], // Remove required validator for disabled field
      description: [''], // Remove maxLength validator as it's optional
      numberOfPositions: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      
      // Positions array
      positions: this.fb.array([])
    });

    // Add at least one position by default
    this.addPosition();

    // Set initial disabled state
    this.updateFormDisabledState();
  }

  /**
   * Update the disabled state of all form controls based on isActionsDisabled
   */
  private updateFormDisabledState(): void {
    if (!this.orderForm) return;

    const controls = ['orderNumber', 'description', 'numberOfPositions'];
    
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
      'jobTitle', 'expectedSalary', 'expectedSalaryType', 'currencyID',
      'feeType', 'feeAmount', 'feeCurrencyID', 'feePercentage', 'feeMultiplier', 'feeSalaryType',
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
    const orderNumberValid = this.orderForm.get('orderNumber')?.valid ?? false;
    const numberOfPositionsValid = this.orderForm.get('numberOfPositions')?.valid ?? false;
    const descriptionValid = this.orderForm.get('description')?.valid ?? false;
    // Skip clientName validation since it's disabled
    
    return orderNumberValid && numberOfPositionsValid && descriptionValid;
  }

  /**
   * Check if all positions are valid
   */
  get areAllPositionsValid(): boolean {
    if (!this.orderForm || !this.positions || this.positions.length === 0) return false;
    
    const allValid = this.positions.controls.every((position, index) => {
      if (!position.valid) {
        const positionGroup = position as FormGroup;
        console.log(`Position ${index + 1} is invalid:`, {
          errors: position.errors,
          value: position.value,
          controls: Object.keys(positionGroup.controls).map(key => ({
            key,
            valid: position.get(key)?.valid,
            errors: position.get(key)?.errors,
            value: position.get(key)?.value
          }))
        });
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
  getExtraFeeTypeName(extraFeeTypeID: number): string {
    if (!this.extraFeeTypes || !extraFeeTypeID) return '';
    const extraFeeType = this.extraFeeTypes.find(type => type.ID === extraFeeTypeID);
    return extraFeeType ? extraFeeType.name : '';
  }

  /**
   * Create a new position FormGroup
   */
  private createPositionForm(): FormGroup {
    
    return this.fb.group({
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      expectedSalary: [0, [Validators.required, Validators.min(0)]], // Set default to 0 and make required
      expectedSalaryType: [this.defaultSalaryTypeID],
      currencyID: [this.defaultCurrencyID], // NO validator - currency is optional selection
      feeType: ['fixed', [Validators.required]],
      feeAmount: [0, [Validators.required, Validators.min(0)]], // Set default to 0
      feeCurrencyID: [this.defaultCurrencyID], // NO validator - currency is optional selection
      feePercentage: [null],
      feeMultiplier: [null],
      feeSalaryType: [this.defaultSalaryTypeID],
      extraFeeTypeID: [this.defaultExtraFeeTypeID],
      extraFeeType: ['fixed', [Validators.required]],
      extraFeeAmount: [0, [Validators.min(0)]], // Set default to 0
      extraFeeCurrencyID: [this.defaultCurrencyID], // NO validator - currency is optional selection
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
    
    // Apply disabled state to the new position
    this.updatePositionDisabledState(positionForm);
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
   * Handle fee type change for a position
   */
  onFeeTypeChange(positionIndex: number, feeType: string): void {
    const position = this.positions.at(positionIndex);
    
    // Reset fee-related fields
    position.patchValue({
      feeAmount: null,
      feePercentage: null,
      feeMultiplier: null
    });

    // Update validators based on fee type
    const feeAmountControl = position.get('feeAmount');
    const feePercentageControl = position.get('feePercentage');
    const feeMultiplierControl = position.get('feeMultiplier');

    // Clear all validators first
    feeAmountControl?.clearValidators();
    feePercentageControl?.clearValidators();
    feeMultiplierControl?.clearValidators();

    // Add appropriate validators based on fee type
    if (feeType === 'fixed') {
      feeAmountControl?.setValidators([Validators.required, Validators.min(0)]);
    } else if (feeType === 'percentage') {
      feePercentageControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else if (feeType === 'multiplier') {
      feeMultiplierControl?.setValidators([Validators.required, Validators.min(0)]);
    }

    // Update validity
    feeAmountControl?.updateValueAndValidity();
    feePercentageControl?.updateValueAndValidity();
    feeMultiplierControl?.updateValueAndValidity();
  }
  
  /**
   * Handle extra fee type ID change (admin, cancel, none, etc.)
   */
  onExtraFeeTypeIDChange(positionIndex: number, extraFeeTypeID: number): void {
    const position = this.positions.at(positionIndex);
    const extraFeeTypeName = this.getExtraFeeTypeName(extraFeeTypeID);
    
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
    if (this.orderForm.valid && !this.isActionsDisabled && !this.isSubmitting) {
      this.isSubmitting = true;
      this.orderCreating.emit(true);

      const formData = this.prepareFormData();
      console.log('Creating recruiting order with data:', formData);

      this.rest.createRecruitingOrder(formData).subscribe({
        next: (res) => {
          if (res.status === 200 || res.status === 201) {
            console.log('Recruiting order created successfully:', res.data);
            this.orderCreated.emit(res.data);
            this.dialogService.showSnackBar('Recruiting order created successfully!', '', 3000);
          }
        },
        error: (err) => {
          console.error('Error creating recruiting order:', err);
          this.dialogService.showMsgDialog('Error creating recruiting order: ' + (err.error?.message || err.message));
          this.orderCreating.emit(false);
        },
        complete: () => {
          this.isSubmitting = false;
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
      orderNumber: formValue.orderNumber,
      clientName: this.deal?.client?.name || '', // Get from deal since field is disabled
      description: formValue.description,
      numberOfPositions: formValue.numberOfPositions,
      positions: formValue.positions.map((pos: any) => {
        const extraFeeTypeName = this.getExtraFeeTypeName(pos.extraFeeTypeID);
        const isExtraFeeNone = extraFeeTypeName === 'NONE';
        
        return {
          jobTitle: pos.jobTitle,
          expectedSalary: pos.expectedSalary,
          expectedSalaryType: pos.expectedSalaryType,
          currencyID: pos.currencyID,
          feeType: pos.feeType,
          feeAmount: pos.feeType === 'fixed' ? pos.feeAmount : null,
          feeCurrencyID: pos.feeType === 'fixed' ? pos.feeCurrencyID : null,
          feePercentage: pos.feeType === 'percentage' ? pos.feePercentage : null,
          feeMultiplier: pos.feeType === 'multiplier' ? pos.feeMultiplier : null,
          feeSalaryType: (pos.feeType === 'percentage' || pos.feeType === 'multiplier') ? pos.feeSalaryType : null,
          extraFeeTypeID: pos.extraFeeTypeID,
          extraFeeType: !isExtraFeeNone ? pos.extraFeeType : null,
          extraFeeAmount: (!isExtraFeeNone && pos.extraFeeType === 'fixed') ? pos.extraFeeAmount : null,
          extraFeeCurrencyID: (!isExtraFeeNone && pos.extraFeeType === 'fixed') ? pos.extraFeeCurrencyID : null,
          extraFeePercentage: (!isExtraFeeNone && pos.extraFeeType === 'percentage') ? pos.extraFeePercentage : null,
          extraFeeMultiplier: (!isExtraFeeNone && pos.extraFeeType === 'multiplier') ? pos.extraFeeMultiplier : null,
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