import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule, DecimalPipe } from '@angular/common';
import { RestService } from '../services/rest.service';
import { UserService } from '../services/user.service';
import { DialogService } from '../services/dialog.service';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../shared/components/ui/card/card.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    CommonModule,
    FormsModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './invoices.component.html'
})
export class InvoicesComponent implements OnInit {

  invoices: any[] = [];
  totalCount = 0;
  pageSize = 20;
  offset = 0;
  loading = true;

  filterSearch = '';
  filterType = '';
  Math = Math;

  typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'placement', label: 'Placement' },
    { value: 'admin_fee', label: 'Admin Fee' },
    { value: 'cancel_fee', label: 'Cancel Fee' }
  ];

  constructor(
    private rest: RestService,
    public userService: UserService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices() {
    this.loading = true;
    this.rest.getApprovedRecruitingInvoices({
      offset: this.offset,
      limit: this.pageSize,
      search: this.filterSearch || undefined,
      type: this.filterType || undefined
    }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.invoices = res.data;
          this.totalCount = res.totalCount;
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.offset = 0;
    this.loadInvoices();
  }

  clearFilters() {
    this.filterSearch = '';
    this.filterType = '';
    this.offset = 0;
    this.loadInvoices();
  }

  nextPage() {
    if (this.offset + this.pageSize < this.totalCount) {
      this.offset += this.pageSize;
      this.loadInvoices();
    }
  }

  prevPage() {
    if (this.offset > 0) {
      this.offset = Math.max(0, this.offset - this.pageSize);
      this.loadInvoices();
    }
  }

  get currentPage(): number {
    return Math.floor(this.offset / this.pageSize) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  getInvoiceTypeLabel(type: string): string {
    switch (type) {
      case 'placement': return 'Placement';
      case 'admin_fee': return 'Admin Fee';
      case 'cancel_fee': return 'Cancel Fee';
      default: return type;
    }
  }

  getInvoiceTypeBadgeVariant(type: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (type) {
      case 'placement': return 'success';
      case 'admin_fee': return 'info';
      case 'cancel_fee': return 'warning';
      default: return 'outline';
    }
  }

  exportInvoice(inv: any): void {
    this.rest.getInvoiceCalculationData(inv.ID).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          const { invoice, calculationData } = res.data;
          this.buildExcel(invoice, calculationData);
        }
      },
      error: (err) => {
        this.dialogService.errorServDialog(err);
      }
    });
  }

  private buildExcel(invoice: any, calcData: any): void {
    if (!calcData) {
      this.dialogService.showSnackBar('No calculation data available', '', 3000);
      return;
    }

    const pos = calcData.position || {};
    const cur = calcData.feeCurrencyCode || 'EUR';
    const date = new Date(invoice.created_at).toLocaleDateString('sr-RS');
    const rows: any[][] = [];
    const invoiceType = invoice.invoice_type;

    if (invoiceType === 'admin_fee') {
      rows.push(
        ['Admin Fee Calculation', ''],
        ['', ''],
        ['Position', `${pos.position_number || ''} - ${pos.position_name || ''}`],
        ['Date', date],
        ['', ''],
        ['Expected Salary', pos.expected_salary],
        [`Derived Salary (${this.getDerivedSalaryLabel(calcData.derivedSalaryType, pos.salary_type_id)})`, `${calcData.derivedSalaryForFee} ${cur}`],
        [`Projected Fee per Person (${this.getMainFeeConfigLabel(pos)})`, `${calcData.projectedFeePerPerson} ${cur}`],
        [`Admin Fee per Person (${this.getExtraFeeConfigLabel(pos)})`, `${calcData.adminFeePerPerson} ${cur}`],
        ['Headcount', calcData.headcount || pos.number_of_people],
        ['', ''],
        ['Total Admin Fee', `${calcData.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${calcData.finalFee} ${cur}`],
      );
    } else {
      const typeLabel = invoiceType === 'placement' ? 'Placement Fee' : 'Cancel Fee';
      rows.push(
        [`${typeLabel} Calculation`, ''],
        ['', ''],
        ['Position', `${pos.position_number || ''} - ${pos.position_name || ''}`],
        ['Date', date],
      );

      if (invoice.candidate_first_name) {
        rows.push(['Candidate', `${invoice.candidate_first_name} ${invoice.candidate_last_name}`]);
      }

      rows.push(
        ['', ''],
        ['Entered Salary', calcData.salaryInput?.amount],
        ['Salary Type', invoice.salaryType?.name || ''],
        [`Derived Salary (${this.getDerivedSalaryLabel(calcData.derivedSalaryType, pos.salary_type_id)})`, `${calcData.derivedSalaryForFee} ${cur}`],
        ['Fee Formula', this.getFeeConfigLabel(calcData.feeSnapshot)],
        ['', ''],
        ['Calculated Fee', `${calcData.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${calcData.finalFee} ${cur}`],
      );
    }

    if (calcData.feeWasOverridden) {
      rows.push(['Fee Override', 'Yes (manually adjusted)']);
    }

    // Salary calculator breakdown
    const calcResults = calcData.calculatorResults;
    if (calcResults) {
      rows.push(['', ''], ['Salary Calculator Results', ''], ['', 'RSD', 'EUR', 'USD']);
      const labels: Record<string, string> = {
        monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Base Gross', monthlyGrandGross: 'Monthly Grand Gross',
        annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
      };
      for (const [key, label] of Object.entries(labels)) {
        rows.push([
          label,
          calcResults['RSD']?.[key] || '',
          calcResults['EUR']?.[key] || '',
          calcResults['USD']?.[key] || ''
        ]);
      }
    }

    // Exchange rates
    if (calcData.exchangeRates) {
      rows.push(['', ''], ['Exchange Rates', '']);
      if (calcData.exchangeRates.EUR) {
        rows.push(['1 EUR', `${calcData.exchangeRates.EUR} RSD`]);
      }
      if (calcData.exchangeRates.USD) {
        rows.push(['1 USD', `${calcData.exchangeRates.USD} RSD`]);
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Calculation');

    const typeSlug = invoiceType === 'admin_fee' ? 'AdminFee' :
                     invoiceType === 'placement' ? 'Placement' : 'CancelFee';
    XLSX.writeFile(wb, `${typeSlug}_${pos.position_number || invoice.ID}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  private getDerivedSalaryLabel(key: string | null, salaryTypeId?: number): string {
    const map: Record<string, string> = {
      monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Gross', monthlyGrandGross: 'Monthly Grand Gross',
      annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
    };
    if (key && map[key]) return map[key];
    // Fallback: derive from salary_type_id for old invoices
    if (salaryTypeId) {
      const typeMap: Record<number, string> = {
        1: 'monthlyGrandGross', 2: 'monthlyGross', 3: 'monthlyNet',
        4: 'annualGross', 5: 'annualGrandGross', 6: 'annualNet'
      };
      const derived = typeMap[salaryTypeId];
      if (derived && map[derived]) return map[derived];
    }
    return key || '';
  }

  private getFeeConfigLabel(feeSnapshot: any): string {
    if (!feeSnapshot) return 'N/A';
    switch (feeSnapshot.fee_types_id) {
      case 1: return `${feeSnapshot.fee_percentage}%`;
      case 2: return `${feeSnapshot.fee_multiplier}x`;
      case 3: return `Fixed: ${feeSnapshot.fee_fixed_amount}`;
      default: return 'N/A';
    }
  }

  private getMainFeeConfigLabel(pos: any): string {
    switch (pos.fee_types_id) {
      case 1: return `${pos.fee_percentage}%`;
      case 2: return `${pos.fee_multiplier}x`;
      case 3: return `Fixed: ${pos.fee_amount}`;
      default: return 'N/A';
    }
  }

  private getExtraFeeConfigLabel(pos: any): string {
    switch (pos.extra_fee_calculation_type) {
      case 1: return `${pos.extra_fee_amount}%`;
      case 2: return `${pos.extra_fee_amount}x`;
      case 3: return `Fixed: ${pos.extra_fee_amount}`;
      default: return 'N/A';
    }
  }
}
