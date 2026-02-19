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
import * as XLSX from 'xlsx';

export interface InvoiceDialogData {
  mode: 'placement' | 'admin_fee' | 'cancel_fee';
  position: any;
  orderID: number;
  existingInvoices?: any[];
  clientCurrency?: any; // { ID, code, name } from client.currency
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
  isCalculating = false;
  calculatedFee = 0;
  feeOverridden = false;

  // Calculator results
  feeBreakdown: any = null;
  derivedSalaryForFee: number | null = null;
  derivedSalaryType: string | null = null;

  // Admin fee breakdown
  adminFeePerPerson: number | null = null;
  projectedFeePerPerson: number | null = null;
  adminHeadcount: number | null = null;

  // Warnings
  adminFeeAlreadyExists = false;
  existingAdminFeeAmount: number | null = null; // for placement deduction warning
  adminFeePerPersonForDeduction: number | null = null;

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
  }

  get mode() { return this.data.mode; }
  get position() { return this.data.position; }

  get needsSalaryInput(): boolean {
    if (this.position.fee_types_id === 3) return false;
    if (this.mode === 'admin_fee') return false;
    return true;
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

    // Check if admin fee already exists (warning for admin_fee mode)
    if (this.mode === 'admin_fee') {
      this.adminFeeAlreadyExists = invoices.some(
        (inv: any) => inv.invoice_type === 'admin_fee'
      );
    }

    // For placement mode: check if admin fee was charged, calculate deduction amount
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
          // After currencies load, auto-calculate admin fee if applicable
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

    // Fee currency: prefer client currency, fallback to position fee currency
    const clientCurrencyId = this.data.clientCurrency?.ID || null;
    const feeCurrencyId = clientCurrencyId || pos.fee_currency_id || null;

    this.invoiceForm = this.fb.group({
      candidate_first_name: [null, this.mode === 'placement' ? Validators.required : []],
      candidate_last_name: [null, this.mode === 'placement' ? Validators.required : []],
      salary_amount: [salaryAmount, salaryRequired],
      salary_type_id: [salaryTypeId, salaryRequired],
      salary_currency_id: [salaryCurrencyId, Validators.required],
      final_fee_amount: [null, Validators.required],
      fee_currency_id: [feeCurrencyId, Validators.required],
      notes: [null]
    });

    // For fixed fee, set immediately
    if (pos.fee_types_id === 3 && this.mode !== 'admin_fee') {
      this.calculatedFee = parseFloat(pos.fee_amount) || 0;
      this.invoiceForm.get('final_fee_amount')!.setValue(this.calculatedFee, { emitEvent: false });
    }
  }

  /** Auto-calculate admin fee via backend (salary calc → projected fee → extra fee % → × headcount) */
  calculateAdminFee(): void {
    const feeCurrencyId = this.invoiceForm.get('fee_currency_id')!.value;
    const feeCurrency = this.currencies.find((c: any) => c.ID === feeCurrencyId);
    const feeCurrencyCode = feeCurrency?.code || this.data.clientCurrency?.code || 'EUR';

    this.isCalculating = true;
    this.feeBreakdown = null;

    this.rest.calculateRecruitingFee({
      positionId: this.position.ID,
      salary: 0, // not used for admin_fee
      salaryInputTypeId: 0, // not used for admin_fee
      currencyCode: 'EUR',
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
        console.error('Admin fee calculation failed:', err);
        this.dialogService.showSnackBar('Admin fee calculation failed: ' + (err.error?.message || err.message), '', 4000);
      }
    });
  }

  /** Calculate placement/cancel fee via backend salary calculator endpoint */
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
      feeCurrencyCode
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
        console.error('Fee calculation failed:', err);
        this.dialogService.showSnackBar('Fee calculation failed: ' + (err.error?.message || err.message), '', 4000);
        this.recalculateSimple();
      }
    });
  }

  /** Simple client-side fee calculation (fallback) */
  recalculateSimple(): void {
    const salary = parseFloat(this.invoiceForm.get('salary_amount')!.value) || 0;
    const pos = this.position;

    switch (pos.fee_types_id) {
      case 1:
        this.calculatedFee = Math.round(salary * (parseFloat(pos.fee_percentage) || 0) / 100 * 100) / 100;
        break;
      case 2:
        this.calculatedFee = Math.round(salary * (parseFloat(pos.fee_multiplier) || 1) * 100) / 100;
        break;
      case 3:
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
      monthlyNet: 'Monthly Net',
      monthlyGross: 'Monthly Gross',
      monthlyGrandGross: 'Monthly Grand Gross',
      annualNet: 'Annual Net',
      annualGross: 'Annual Base Gross',
      annualGrandGross: 'Annual Grand Gross'
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

  /** Deduct admin fee per person from the current fee amount */
  deductAdminFee(): void {
    if (!this.adminFeePerPersonForDeduction) return;
    const currentFee = parseFloat(this.invoiceForm.get('final_fee_amount')!.value) || 0;
    const newFee = Math.round((currentFee - this.adminFeePerPersonForDeduction) * 100) / 100;
    this.invoiceForm.get('final_fee_amount')!.setValue(newFee, { emitEvent: false });
    this.feeOverridden = true;
  }

  /** Export calculation breakdown to Excel */
  exportCalculation(): void {
    if (!this.feeBreakdown) return;

    const pos = this.position;
    const cur = this.feeBreakdown.feeCurrencyCode || 'EUR';
    const date = new Date().toLocaleDateString('sr-RS');
    const rows: any[][] = [];

    if (this.mode === 'admin_fee') {
      rows.push(
        ['Admin Fee Calculation', ''],
        ['', ''],
        ['Position', `${pos.position_number} - ${pos.position_name}`],
        ['Date', date],
        ['', ''],
        ['Expected Salary', pos.expected_salary],
        [`Derived Salary (${this.getDerivedSalaryLabel()})`, `${this.derivedSalaryForFee} ${cur}`],
        [`Projected Fee per Person (${this.getMainFeeConfigLabel()})`, `${this.projectedFeePerPerson} ${cur}`],
        [`Admin Fee per Person (${this.getFeeConfigLabel()})`, `${this.adminFeePerPerson} ${cur}`],
        ['Headcount', this.adminHeadcount],
        ['', ''],
        ['Total Admin Fee', `${this.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${this.invoiceForm.get('final_fee_amount')!.value} ${cur}`],
      );
    } else {
      const typeLabel = this.mode === 'placement' ? 'Placement Fee' : 'Cancel Fee';
      rows.push(
        [`${typeLabel} Calculation`, ''],
        ['', ''],
        ['Position', `${pos.position_number} - ${pos.position_name}`],
        ['Date', date],
        ['', ''],
        ['Entered Salary', this.invoiceForm.get('salary_amount')!.value],
        ['Salary Type', this.salaryTypes.find((s: any) => s.ID === this.invoiceForm.get('salary_type_id')!.value)?.name || ''],
        [`Derived Salary (${this.getDerivedSalaryLabel()})`, `${this.derivedSalaryForFee} ${cur}`],
        [`Fee Formula`, this.getFeeConfigLabel()],
        ['', ''],
        ['Calculated Fee', `${this.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${this.invoiceForm.get('final_fee_amount')!.value} ${cur}`],
      );

      if (this.adminFeePerPersonForDeduction) {
        rows.push(
          ['', ''],
          ['Admin Fee Charged (total)', `${this.existingAdminFeeAmount} ${cur}`],
          ['Admin Fee per Person (deduction)', `${this.adminFeePerPersonForDeduction} ${cur}`],
        );
      }
    }

    // Add salary calculator breakdown if available
    const calcResult = this.feeBreakdown.calculatorResult;
    if (calcResult?.results) {
      rows.push(['', ''], ['Salary Calculator Results', ''], ['', 'RSD', 'EUR', 'USD']);
      const labels: Record<string, string> = {
        monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Base Gross', monthlyGrandGross: 'Monthly Grand Gross',
        annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
      };
      for (const [key, label] of Object.entries(labels)) {
        rows.push([
          label,
          calcResult.results.RSD?.[key] || '',
          calcResult.results.EUR?.[key] || '',
          calcResult.results.USD?.[key] || ''
        ]);
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

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    this.invoiceForm.markAllAsTouched();
    if (this.invoiceForm.invalid) return;

    this.isSubmitting = true;
    const formVal = this.invoiceForm.value;

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
