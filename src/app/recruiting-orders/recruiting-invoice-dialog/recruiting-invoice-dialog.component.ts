import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { LabelComponent } from '../../shared/components/ui/label/label.component';
import { TextareaComponent } from '../../shared/components/ui/textarea/textarea.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import * as XLSX from 'xlsx';

export interface InvoiceDialogData {
  mode: 'placement' | 'admin_fee' | 'cancel_fee';
  position: any;
  orderID: number;
  existingInvoices?: any[];
  clientCurrency?: any; // { ID, code, name } from client.currency
  paymentDueDaysPlacement?: number;
  paymentDueDaysAdditional?: number;
  clientCountry?: string; // ISO country code from client, e.g. 'RS'
}

@Component({
  selector: 'app-recruiting-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
  isCalculating = false;
  calculatedFee = 0;
  feeOverridden = false;

  // Calculator results (single-candidate mode)
  feeBreakdown: any = null;
  derivedSalaryForFee: number | null = null;
  derivedSalaryType: string | null = null;

  // Admin fee breakdown
  adminFeePerPerson: number | null = null;
  projectedFeePerPerson: number | null = null;
  adminHeadcount: number | null = null;

  // Warnings
  adminFeeAlreadyExists = false;
  existingAdminFeeAmount: number | null = null;
  adminFeePerPersonForDeduction: number | null = null;

  // Multi-candidate state (placement only)
  candidateCalculations: any[] = []; // per-candidate fee calc results
  candidateCalculating: boolean[] = []; // per-candidate loading states
  groupingMode: 'individual' | 'grouped' = 'individual';

  // Invoice description
  invoiceDescription: string = '';

  // Invoice dates
  invoiceDate: string = '';
  serviceDate: string = '';

  constructor(
    public dialogRef: MatDialogRef<RecruitingInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvoiceDialogData,
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.checkExistingInvoices();
    this.loadRelationData();
    this.initForm();
    // Default invoice/service dates to today
    const today = new Date().toISOString().slice(0, 10);
    this.invoiceDate = today;
    this.serviceDate = today;
    // Auto-generate invoice description
    this.invoiceDescription = this.generateDescription(this.mode, this.position.position_name, this.data.clientCountry);
  }

  get mode() { return this.data.mode; }
  get position() { return this.data.position; }

  get needsSalaryInput(): boolean {
    if (this.position.fee_types_id === 3) return false;
    if (this.mode === 'admin_fee') return false;
    return true;
  }

  /** Max candidates allowed = headcount - filled */
  get maxCandidates(): number {
    return this.position.number_of_people - (this.position.number_filled || 0);
  }

  /** Whether the form is in multi-candidate mode */
  get isMultiCandidate(): boolean {
    return this.mode === 'placement' && this.candidatesArray && this.candidatesArray.length > 1;
  }

  /** The FormArray of candidates */
  get candidatesArray(): FormArray {
    return this.invoiceForm?.get('candidates') as FormArray;
  }

  get expectedSalaryCurrencyCode(): string {
    const id = this.position?.expected_salary_currency_id;
    if (!id) return '';
    return this.currencies.find((c: any) => c.ID === id)?.code || '';
  }

  get selectedFeeCurrencyCode(): string {
    const id = this.invoiceForm?.get('fee_currency_id')?.value;
    if (!id) return '';
    return this.currencies.find((c: any) => c.ID === id)?.code || '';
  }

  /** Total fee across all candidates */
  get totalFee(): number {
    if (!this.candidatesArray) return 0;
    let total = 0;
    for (let i = 0; i < this.candidatesArray.length; i++) {
      total += parseFloat(this.candidatesArray.at(i).get('final_fee_amount')!.value) || 0;
    }
    return Math.round(total * 100) / 100;
  }

  /** Get the applicable payment due days based on invoice mode */
  get paymentDueDays(): number | null {
    if (this.mode === 'placement') {
      return this.data.paymentDueDaysPlacement ?? null;
    }
    return this.data.paymentDueDaysAdditional ?? null;
  }

  /** Computed payment date = invoiceDate + paymentDueDays */
  get paymentDate(): string | null {
    if (!this.invoiceDate || !this.paymentDueDays) return null;
    const d = new Date(this.invoiceDate);
    d.setDate(d.getDate() + this.paymentDueDays);
    return d.toISOString().slice(0, 10);
  }

  getTitle(): string {
    switch (this.mode) {
      case 'placement': return 'Close Position (Placement)';
      case 'admin_fee': return 'Admin Fee';
      case 'cancel_fee': return 'Cancel Fee';
      default: return 'Invoice';
    }
  }

  checkExistingInvoices(): void {
    const invoices = this.data.existingInvoices || [];

    if (this.mode === 'admin_fee') {
      this.adminFeeAlreadyExists = invoices.some(
        (inv: any) => inv.invoice_type === 'admin_fee'
      );
    }

    if (this.mode === 'placement') {
      const adminInvoice = invoices.find(
        (inv: any) => inv.invoice_type === 'admin_fee'
      );
      if (adminInvoice) {
        this.existingAdminFeeAmount = parseFloat(adminInvoice.final_fee_amount) || 0;
        const headcount = this.position.number_of_people || 1;
        this.adminFeePerPersonForDeduction = Math.round(this.existingAdminFeeAmount / headcount * 100) / 100;
      }
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
        if (res.status === 200) {
          this.currencies = res.data;
          this.autoSetFeeCurrency();
          if (this.mode === 'admin_fee') {
            this.calculateAdminFee();
          }
        }
      }
    });
  }

  initForm(): void {
    const pos = this.position;

    let salaryAmount = null;
    let salaryTypeId = pos.salary_type_id || null;
    let salaryCurrencyId = pos.expected_salary_currency_id || pos.fee_currency_id || null;

    if (this.mode === 'admin_fee') {
      salaryAmount = pos.expected_salary || null;
      salaryTypeId = pos.expected_salary_type_id || pos.salary_type_id || null;
      salaryCurrencyId = pos.expected_salary_currency_id || pos.fee_currency_id || null;
    }

    const salaryRequired = this.needsSalaryInput ? Validators.required : [];
    const clientCurrencyId = this.data.clientCurrency?.ID || null;
    const feeCurrencyId = clientCurrencyId || pos.fee_currency_id || null;

    if (this.mode === 'placement') {
      // Placement uses candidates FormArray
      this.invoiceForm = this.fb.group({
        candidates: this.fb.array([]),
        fee_currency_id: [feeCurrencyId, Validators.required],
        notes: [null]
      });

      // Add first candidate row
      this.addCandidate();
    } else {
      // admin_fee / cancel_fee: single-candidate form (unchanged)
      this.invoiceForm = this.fb.group({
        candidate_first_name: [null],
        candidate_last_name: [null],
        salary_amount: [salaryAmount, salaryRequired],
        salary_type_id: [salaryTypeId, salaryRequired],
        salary_currency_id: [salaryCurrencyId, Validators.required],
        final_fee_amount: [null, Validators.required],
        fee_currency_id: [feeCurrencyId, Validators.required],
        notes: [null]
      });

      if (pos.fee_types_id === 3 && this.mode !== 'admin_fee') {
        this.calculatedFee = parseFloat(pos.fee_amount) || 0;
        this.invoiceForm.get('final_fee_amount')!.setValue(this.calculatedFee, { emitEvent: false });
      }
    }
  }

  /** Create a new candidate FormGroup */
  createCandidateGroup(): FormGroup {
    const pos = this.position;
    const salaryCurrencyId = pos.expected_salary_currency_id || pos.fee_currency_id || null;
    const salaryTypeId = pos.salary_type_id || null;
    const salaryRequired = this.needsSalaryInput ? Validators.required : [];

    const group = this.fb.group({
      candidate_first_name: [null, Validators.required],
      candidate_last_name: [null, Validators.required],
      salary_amount: [null, salaryRequired],
      salary_type_id: [salaryTypeId, salaryRequired],
      salary_currency_id: [salaryCurrencyId, Validators.required],
      final_fee_amount: [null, Validators.required]
    });

    // For fixed fee, pre-fill
    if (pos.fee_types_id === 3) {
      const fixedFee: any = parseFloat(pos.fee_amount) || 0;
      group.get('final_fee_amount')!.setValue(fixedFee, { emitEvent: false });
    }

    return group;
  }

  addCandidate(): void {
    if (this.candidatesArray.length >= this.maxCandidates) {
      this.dialogService.showSnackBar(`Maximum ${this.maxCandidates} candidates allowed`, '', 3000);
      return;
    }
    this.candidatesArray.push(this.createCandidateGroup());
    this.candidateCalculations.push(null);
    this.candidateCalculating.push(false);
  }

  removeCandidate(index: number): void {
    if (this.candidatesArray.length <= 1) return;
    this.candidatesArray.removeAt(index);
    this.candidateCalculations.splice(index, 1);
    this.candidateCalculating.splice(index, 1);
  }

  /** Calculate fee for a specific candidate row */
  calculateCandidateFee(index: number): void {
    const group = this.candidatesArray.at(index) as FormGroup;
    const salary = parseFloat(group.get('salary_amount')!.value);
    const salaryTypeId = group.get('salary_type_id')!.value;
    const salaryCurrencyId = group.get('salary_currency_id')!.value;

    if (!salary || !salaryTypeId || !salaryCurrencyId) {
      this.dialogService.showSnackBar('Please fill in salary amount, type and currency first', '', 3000);
      return;
    }

    const currency = this.currencies.find((c: any) => c.ID === salaryCurrencyId);
    const currencyCode = currency?.code || 'EUR';
    const feeCurrencyId = this.invoiceForm.get('fee_currency_id')!.value;
    const feeCurrency = this.currencies.find((c: any) => c.ID === feeCurrencyId);
    const feeCurrencyCode = feeCurrency?.code || currencyCode;

    this.candidateCalculating[index] = true;

    this.rest.calculateRecruitingFee({
      salary,
      salaryInputTypeId: salaryTypeId,
      positionId: this.position.ID,
      currencyCode,
      feeCurrencyCode,
      invoiceType: this.mode
    }).subscribe({
      next: (res) => {
        this.candidateCalculating[index] = false;
        if (res.status === 200) {
          const data = res.data;
          this.candidateCalculations[index] = data;
          const currentFinal = parseFloat(group.get('final_fee_amount')!.value) || 0;
          const wasOverridden = currentFinal && Math.abs(currentFinal - data.calculatedFee) > 0.001;
          if (!wasOverridden) {
            group.get('final_fee_amount')!.setValue(data.calculatedFee, { emitEvent: false });
          }
        }
      },
      error: (err) => {
        this.candidateCalculating[index] = false;
        this.dialogService.showSnackBar('Fee calculation failed for candidate #' + (index + 1), '', 3000);
        // Fallback simple calc
        this.recalculateCandidateSimple(index);
      }
    });
  }

  /** Calculate fees for all candidates */
  calculateAllFees(): void {
    for (let i = 0; i < this.candidatesArray.length; i++) {
      const group = this.candidatesArray.at(i) as FormGroup;
      if (group.get('salary_amount')!.value && group.get('salary_type_id')!.value) {
        this.calculateCandidateFee(i);
      }
    }
  }

  /** Simple client-side fee calculation for a candidate row */
  recalculateCandidateSimple(index: number): void {
    const group = this.candidatesArray.at(index) as FormGroup;
    const salary = parseFloat(group.get('salary_amount')!.value) || 0;
    const pos = this.position;
    let fee = 0;

    switch (pos.fee_types_id) {
      case 1: fee = Math.round(salary * (parseFloat(pos.fee_percentage) || 0) / 100 * 100) / 100; break;
      case 2: fee = Math.round(salary * (parseFloat(pos.fee_multiplier) || 1) * 100) / 100; break;
      case 3: fee = parseFloat(pos.fee_amount) || 0; break;
    }

    group.get('final_fee_amount')!.setValue(fee, { emitEvent: false });
  }

  /** Deduct admin fee for a specific candidate row */
  deductAdminFeeForCandidate(index: number): void {
    if (!this.adminFeePerPersonForDeduction) return;
    const group = this.candidatesArray.at(index) as FormGroup;
    const currentFee = parseFloat(group.get('final_fee_amount')!.value) || 0;
    const newFee = Math.round((currentFee - this.adminFeePerPersonForDeduction) * 100) / 100;
    group.get('final_fee_amount')!.setValue(newFee, { emitEvent: false });
  }

  /** Check if a candidate row's fee was overridden */
  isCandidateFeeOverridden(index: number): boolean {
    const calc = this.candidateCalculations[index];
    if (!calc) return false;
    const group = this.candidatesArray.at(index) as FormGroup;
    const finalFee = parseFloat(group.get('final_fee_amount')!.value) || 0;
    return Math.abs(finalFee - calc.calculatedFee) > 0.001;
  }

  resetCandidateFee(index: number): void {
    const calc = this.candidateCalculations[index];
    if (!calc) return;
    const group = this.candidatesArray.at(index) as FormGroup;
    group.get('final_fee_amount')!.setValue(calc.calculatedFee, { emitEvent: false });
  }

  // --- Single-candidate methods (admin_fee / cancel_fee) ---

  /** If fee_currency_id wasn't set from client/position, auto-detect from client country */
  autoSetFeeCurrency(): void {
    const current = this.invoiceForm.get('fee_currency_id')?.value;
    if (current) return; // already set

    let targetCode: string | null = null;
    if (this.data.clientCountry === 'RS') {
      targetCode = 'RSD';
    }
    if (!targetCode) return;

    const found = this.currencies.find((c: any) => c.code === targetCode);
    if (found) {
      this.invoiceForm.patchValue({ fee_currency_id: found.ID });
      if (this.mode === 'admin_fee') {
        this.invoiceForm.patchValue({ salary_currency_id: found.ID });
      }
    }
  }

  calculateAdminFee(): void {
    const feeCurrencyId = this.invoiceForm.get('fee_currency_id')!.value;
    const feeCurrency = this.currencies.find((c: any) => c.ID === feeCurrencyId);
    const feeCurrencyCode = feeCurrency?.code || this.data.clientCurrency?.code || 'EUR';

    const salaryCurrencyId = this.invoiceForm.get('salary_currency_id')?.value;
    const salaryCurrency = this.currencies.find((c: any) => c.ID === salaryCurrencyId);
    const currencyCode = salaryCurrency?.code || feeCurrencyCode;

    this.isCalculating = true;
    this.feeBreakdown = null;

    this.rest.calculateRecruitingFee({
      positionId: this.position.ID,
      salary: 0,
      salaryInputTypeId: 0,
      currencyCode,
      feeCurrencyCode,
      invoiceType: 'admin_fee'
    } as any).subscribe({
      next: (res) => {
        this.isCalculating = false;
        if (res.status === 200) {
          const data = res.data;
          this.calculatedFee = data.calculatedFee;
          this.adminFeePerPerson = data.adminFeePerPerson;
          this.projectedFeePerPerson = data.projectedFeePerPerson;
          this.adminHeadcount = data.headcount;
          this.derivedSalaryForFee = data.derivedSalaryForFee;
          this.derivedSalaryType = data.derivedSalaryType;
          this.feeBreakdown = data;

          if (!this.feeOverridden) {
            this.invoiceForm.get('final_fee_amount')!.setValue(this.calculatedFee, { emitEvent: false });
          }
        }
      },
      error: (err) => {
        this.isCalculating = false;
        this.dialogService.showSnackBar('Admin fee calculation failed: ' + (err.error?.message || err.message), '', 4000);
      }
    });
  }

  calculateFee(): void {
    const salary = parseFloat(this.invoiceForm.get('salary_amount')!.value);
    const salaryTypeId = this.invoiceForm.get('salary_type_id')!.value;
    const salaryCurrencyId = this.invoiceForm.get('salary_currency_id')!.value;

    if (!salary || !salaryTypeId || !salaryCurrencyId) {
      this.dialogService.showSnackBar('Please fill in salary amount, type and currency first', '', 3000);
      return;
    }

    const currency = this.currencies.find((c: any) => c.ID === salaryCurrencyId);
    const currencyCode = currency?.code || 'EUR';
    const feeCurrencyId = this.invoiceForm.get('fee_currency_id')!.value;
    const feeCurrency = this.currencies.find((c: any) => c.ID === feeCurrencyId);
    const feeCurrencyCode = feeCurrency?.code || currencyCode;

    this.isCalculating = true;
    this.feeBreakdown = null;

    this.rest.calculateRecruitingFee({
      salary,
      salaryInputTypeId: salaryTypeId,
      positionId: this.position.ID,
      currencyCode,
      feeCurrencyCode,
      invoiceType: this.mode
    }).subscribe({
      next: (res) => {
        this.isCalculating = false;
        if (res.status === 200) {
          const data = res.data;
          this.calculatedFee = data.calculatedFee;
          this.derivedSalaryForFee = data.derivedSalaryForFee;
          this.derivedSalaryType = data.derivedSalaryType;
          this.feeBreakdown = data;

          if (!this.feeOverridden) {
            this.invoiceForm.get('final_fee_amount')!.setValue(this.calculatedFee, { emitEvent: false });
          }
        }
      },
      error: (err) => {
        this.isCalculating = false;
        this.dialogService.showSnackBar('Fee calculation failed: ' + (err.error?.message || err.message), '', 4000);
        this.recalculateSimple();
      }
    });
  }

  recalculateSimple(): void {
    const salary = parseFloat(this.invoiceForm.get('salary_amount')!.value) || 0;
    const pos = this.position;

    if (this.mode === 'cancel_fee') {
      // Cancel fee: use extra fee config
      const calcType = pos.extra_fee_calculation_type;
      const extraAmount = parseFloat(pos.extra_fee_amount) || 0;
      switch (calcType) {
        case 1: this.calculatedFee = Math.round(salary * extraAmount / 100 * 100) / 100; break;
        case 2: this.calculatedFee = Math.round(salary * extraAmount * 100) / 100; break;
        case 3: this.calculatedFee = extraAmount; break;
        default: this.calculatedFee = 0;
      }
    } else {
      // Placement: use main fee config
      switch (pos.fee_types_id) {
        case 1: this.calculatedFee = Math.round(salary * (parseFloat(pos.fee_percentage) || 0) / 100 * 100) / 100; break;
        case 2: this.calculatedFee = Math.round(salary * (parseFloat(pos.fee_multiplier) || 1) * 100) / 100; break;
        case 3: this.calculatedFee = parseFloat(pos.fee_amount) || 0; break;
        default: this.calculatedFee = 0;
      }
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

  deductAdminFee(): void {
    if (!this.adminFeePerPersonForDeduction) return;
    const currentFee = parseFloat(this.invoiceForm.get('final_fee_amount')!.value) || 0;
    const newFee = Math.round((currentFee - this.adminFeePerPersonForDeduction) * 100) / 100;
    this.invoiceForm.get('final_fee_amount')!.setValue(newFee, { emitEvent: false });
    this.feeOverridden = true;
  }

  // --- Labels ---

  getFeeConfigLabel(): string {
    const pos = this.position;
    if (this.mode === 'admin_fee' || this.mode === 'cancel_fee') {
      switch (pos.extra_fee_calculation_type) {
        case 1: return `Extra: ${pos.extra_fee_amount}%`;
        case 2: return `Extra: ${pos.extra_fee_amount}x`;
        case 3: return `Extra Fixed: ${pos.extra_fee_amount}`;
        default: return 'N/A';
      }
    }
    switch (pos.fee_types_id) {
      case 1: return `${pos.fee_percentage}%`;
      case 2: return `${pos.fee_multiplier}x`;
      case 3: return `Fixed: ${pos.fee_amount}`;
      default: return 'N/A';
    }
  }

  getMainFeeConfigLabel(): string {
    const pos = this.position;
    switch (pos.fee_types_id) {
      case 1: return `${pos.fee_percentage}%`;
      case 2: return `${pos.fee_multiplier}x`;
      case 3: return `Fixed: ${pos.fee_amount}`;
      default: return 'N/A';
    }
  }

  getDerivedSalaryLabel(): string {
    const map: Record<string, string> = {
      monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Gross', monthlyGrandGross: 'Monthly Grand Gross',
      annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
    };
    return map[this.derivedSalaryType || ''] || this.derivedSalaryType || '';
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

  hasCandidateError(index: number, field: string): boolean {
    const group = this.candidatesArray.at(index) as FormGroup;
    const control = group.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  exportCalculation(): void {
    if (!this.feeBreakdown) return;

    const pos = this.position;
    const cur = this.feeBreakdown.feeCurrencyCode || 'EUR';
    const date = new Date().toLocaleDateString('sr-RS');
    const rows: any[][] = [];

    if (this.mode === 'admin_fee') {
      rows.push(
        ['Admin Fee Calculation', ''], ['', ''],
        ['Position', `${pos.position_number} - ${pos.position_name}`],
        ['Date', date], ['', ''],
        ['Expected Salary', pos.expected_salary],
        [`Derived Salary (${this.getDerivedSalaryLabel()})`, `${this.derivedSalaryForFee} ${cur}`],
        [`Projected Fee per Person (${this.getMainFeeConfigLabel()})`, `${this.projectedFeePerPerson} ${cur}`],
        [`Admin Fee per Person (${this.getFeeConfigLabel()})`, `${this.adminFeePerPerson} ${cur}`],
        ['Headcount', this.adminHeadcount], ['', ''],
        ['Total Admin Fee', `${this.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${this.invoiceForm.get('final_fee_amount')!.value} ${cur}`],
      );
    } else {
      const typeLabel = this.mode === 'placement' ? 'Placement Fee' : 'Cancel Fee';
      rows.push(
        [`${typeLabel} Calculation`, ''], ['', ''],
        ['Position', `${pos.position_number} - ${pos.position_name}`],
        ['Date', date], ['', ''],
        ['Entered Salary', this.invoiceForm.get('salary_amount')!.value],
        ['Salary Type', this.salaryTypes.find((s: any) => s.ID === this.invoiceForm.get('salary_type_id')!.value)?.name || ''],
        [`Derived Salary (${this.getDerivedSalaryLabel()})`, `${this.derivedSalaryForFee} ${cur}`],
        ['Fee Formula', this.getFeeConfigLabel()], ['', ''],
        ['Calculated Fee', `${this.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${this.invoiceForm.get('final_fee_amount')!.value} ${cur}`],
      );

      if (this.adminFeePerPersonForDeduction) {
        rows.push(['', ''],
          ['Admin Fee Charged (total)', `${this.existingAdminFeeAmount} ${cur}`],
          ['Admin Fee per Person (deduction)', `${this.adminFeePerPersonForDeduction} ${cur}`],
        );
      }
    }

    const calcResult = this.feeBreakdown.calculatorResult;
    if (calcResult?.results) {
      rows.push(['', ''], ['Salary Calculator Results', ''], ['', 'RSD', 'EUR', 'USD']);
      const labels: Record<string, string> = {
        monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Base Gross', monthlyGrandGross: 'Monthly Grand Gross',
        annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
      };
      for (const [key, label] of Object.entries(labels)) {
        rows.push([label, calcResult.results.RSD?.[key] || '', calcResult.results.EUR?.[key] || '', calcResult.results.USD?.[key] || '']);
      }
    }

    if (calcResult?.exchangeRates) {
      rows.push(['', ''], ['Exchange Rates', '']);
      rows.push(['1 EUR', `${calcResult.exchangeRates.EUR} RSD`]);
      rows.push(['1 USD', `${calcResult.exchangeRates.USD} RSD`]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Calculation');

    const typeSlug = this.mode === 'admin_fee' ? 'AdminFee' : this.mode === 'placement' ? 'Placement' : 'CancelFee';
    XLSX.writeFile(wb, `${typeSlug}_${pos.position_number}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  generateDescription(mode: string, positionName: string, country?: string): string {
    const isSrb = country === 'RS';
    const name = positionName || '';
    switch (mode) {
      case 'placement':
        return isSrb
          ? `Manpower naknada za regrutaciju i selekciju kandidata na poziciji "${name}"`
          : `Manpower fee for recruitment and selection of candidates for the position "${name}"`;
      case 'admin_fee':
        return isSrb
          ? `Manpower naknada za pokrivanje administrativnih troškova procesa regrutacije i selekcije kandidata na poziciji "${name}"`
          : `Manpower fee to cover administrative costs of the recruitment and selection process for the position "${name}"`;
      case 'cancel_fee':
        return isSrb
          ? `Manpower naknada za otkazivanje procesa regrutacije i selekcije kandidata na poziciji "${name}"`
          : `Manpower fee for cancellation of the recruitment and selection process for the position "${name}"`;
      default:
        return '';
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    this.invoiceForm.markAllAsTouched();
    // Also mark all candidate sub-forms as touched
    if (this.candidatesArray) {
      for (let i = 0; i < this.candidatesArray.length; i++) {
        (this.candidatesArray.at(i) as FormGroup).markAllAsTouched();
      }
    }
    if (this.invoiceForm.invalid) return;

    this.isSubmitting = true;
    const formVal = this.invoiceForm.value;

    if (this.mode === 'placement') {
      // Placement mode: build multi-candidate payload
      const feeCurrency = this.currencies.find((c: any) => c.ID === formVal.fee_currency_id);
      const feeCurrencyCode = feeCurrency?.code || 'EUR';

      const candidatePayloads = formVal.candidates.map((c: any) => {
        const sCurrency = this.currencies.find((cur: any) => cur.ID === c.salary_currency_id);
        return {
          candidate_first_name: c.candidate_first_name,
          candidate_last_name: c.candidate_last_name,
          salary_amount: c.salary_amount,
          salary_type_id: c.salary_type_id,
          salary_currency_id: c.salary_currency_id,
          final_fee_amount: c.final_fee_amount,
          currency_code: sCurrency?.code || 'EUR'
        };
      });

      // If only 1 candidate, use single-candidate path for backward compat
      if (candidatePayloads.length === 1) {
        const c = candidatePayloads[0];
        const payload: any = {
          order_id: this.data.orderID,
          position_id: this.position.ID,
          invoice_type: 'placement',
          candidate_first_name: c.candidate_first_name,
          candidate_last_name: c.candidate_last_name,
          salary_amount: c.salary_amount,
          salary_type_id: c.salary_type_id,
          salary_currency_id: c.salary_currency_id,
          final_fee_amount: c.final_fee_amount,
          fee_currency_id: formVal.fee_currency_id,
          currency_code: c.currency_code,
          fee_currency_code: feeCurrencyCode,
          notes: formVal.notes,
          description: this.invoiceDescription || null,
          invoice_date: this.invoiceDate || null,
          service_date: this.serviceDate || null
        };
        this.submitPayload(payload);
      } else {
        // Multi-candidate path
        const payload: any = {
          order_id: this.data.orderID,
          position_id: this.position.ID,
          invoice_type: 'placement',
          fee_currency_id: formVal.fee_currency_id,
          fee_currency_code: feeCurrencyCode,
          notes: formVal.notes,
          description: this.invoiceDescription || null,
          candidates: candidatePayloads,
          grouping_mode: this.groupingMode,
          invoice_date: this.invoiceDate || null,
          service_date: this.serviceDate || null
        };
        this.submitPayload(payload);
      }
    } else {
      // admin_fee / cancel_fee: single-candidate path
      const salaryCurrency = this.currencies.find((c: any) => c.ID === formVal.salary_currency_id);
      const currencyCode = salaryCurrency?.code || 'EUR';
      const feeCurrency = this.currencies.find((c: any) => c.ID === formVal.fee_currency_id);
      const feeCurrencyCode = feeCurrency?.code || currencyCode;

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
        currency_code: currencyCode,
        fee_currency_code: feeCurrencyCode,
        notes: formVal.notes,
        description: this.invoiceDescription || null,
        invoice_date: this.invoiceDate || null,
        service_date: this.serviceDate || null
      };
      this.submitPayload(payload);
    }
  }

  private submitPayload(payload: any): void {
    this.rest.createRecruitingInvoice(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.status === 201) {
          const count = payload.candidates?.length || 1;
          this.dialogService.showSnackBar(
            count > 1 ? `Invoice created for ${count} candidates` : 'Invoice created successfully',
            '', 3000
          );
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
