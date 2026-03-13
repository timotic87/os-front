import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule, DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RestService } from '../services/rest.service';
import { UserService } from '../services/user.service';
import { DialogService } from '../services/dialog.service';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../shared/components/ui/card/card.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';
import { InvoicePreviewDialogComponent } from '../recruiting-orders/invoice-preview-dialog/invoice-preview-dialog.component';
import { SalesInvoicePreviewDialogComponent } from '../sales-invoices/sales-invoice-preview-dialog/sales-invoice-preview-dialog.component';
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

  // Tab
  activeTab: 'recruiting' | 'sales' = 'recruiting';

  // Recruiting invoices state
  invoices: any[] = [];
  totalCount = 0;
  pageSize = 20;
  offset = 0;
  loading = true;
  filterSearch = '';
  filterType = '';
  Math = Math;
  sendingToBC: { [id: number]: boolean } = {};

  typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'placement', label: 'Placement' },
    { value: 'admin_fee', label: 'Admin Fee' },
    { value: 'cancel_fee', label: 'Cancel Fee' }
  ];

  // Sales invoices state
  salesInvoices: any[] = [];
  salesTotalCount = 0;
  salesOffset = 0;
  salesLoading = true;
  salesFilterSearch = '';
  sendingSalesToBC: { [id: number]: boolean } = {};

  openMenuId: string | null = null;

  postBcStatusOptions = [
    { value: '', label: 'BC \u2713', tooltip: 'Sent to Business Central' },
    { value: 'sef', label: 'Sent to SEF', tooltip: 'Invoice registered in Serbian e-invoicing system' },
    { value: 'delivered', label: 'Delivered', tooltip: 'Invoice delivered to client' },
    { value: 'paid', label: 'Paid', tooltip: 'Payment received' },
    { value: 'cancelled', label: 'Cancelled', tooltip: 'Invoice cancelled (storno)' },
    { value: 'void', label: 'Void', tooltip: 'Invoice voided / invalid' },
  ];

  constructor(
    private rest: RestService,
    public userService: UserService,
    private dialogService: DialogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadSalesInvoices();
  }

  switchTab(tab: 'recruiting' | 'sales') {
    this.activeTab = tab;
  }

  // ─── RECRUITING INVOICES ───

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

  openInvoicePreview(inv: any): void {
    this.dialog.open(InvoicePreviewDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { invoiceID: inv.ID }
    });
  }

  sendToBC(inv: any): void {
    if (inv.sent_to_bc) return;
    if (!window.confirm(`Send invoice RI-${inv.ID} to Business Central?`)) return;

    this.sendingToBC[inv.ID] = true;
    this.rest.sendRecruitingInvoiceToBC(inv.ID).subscribe({
      next: (res: any) => {
        this.sendingToBC[inv.ID] = false;
        if (res.status === 200) {
          inv.sent_to_bc = true;
          inv.bc_document_no = res.data?.invoice?.bc_document_no || '';
          this.dialogService.showSnackBar('Invoice sent to BC successfully', '', 3000);
        }
      },
      error: (err: any) => {
        this.sendingToBC[inv.ID] = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }

  // ─── SALES INVOICES ───

  loadSalesInvoices() {
    this.salesLoading = true;
    this.rest.getReadySalesInvoices({
      offset: this.salesOffset,
      limit: this.pageSize,
      customerSearch: this.salesFilterSearch || undefined
    }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.salesInvoices = res.data;
          this.salesTotalCount = res.totalCount;
        }
        this.salesLoading = false;
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
        this.salesLoading = false;
      }
    });
  }

  applySalesFilters() {
    this.salesOffset = 0;
    this.loadSalesInvoices();
  }

  clearSalesFilters() {
    this.salesFilterSearch = '';
    this.salesOffset = 0;
    this.loadSalesInvoices();
  }

  salesNextPage() {
    if (this.salesOffset + this.pageSize < this.salesTotalCount) {
      this.salesOffset += this.pageSize;
      this.loadSalesInvoices();
    }
  }

  salesPrevPage() {
    if (this.salesOffset > 0) {
      this.salesOffset = Math.max(0, this.salesOffset - this.pageSize);
      this.loadSalesInvoices();
    }
  }

  get salesCurrentPage(): number {
    return Math.floor(this.salesOffset / this.pageSize) + 1;
  }

  get salesTotalPages(): number {
    return Math.ceil(this.salesTotalCount / this.pageSize) || 1;
  }

  sendSalesToBC(inv: any): void {
    if (inv.sentToBC) return;
    if (!window.confirm(`Send invoice ${inv.invoiceNo} to Business Central?`)) return;

    this.sendingSalesToBC[inv.id] = true;
    this.rest.sendSalesInvoiceToBC({ invoiceId: inv.id }).subscribe({
      next: (res: any) => {
        this.sendingSalesToBC[inv.id] = false;
        if (res.status === 200) {
          this.dialogService.showSnackBar(`Invoice ${inv.invoiceNo} sent to BC`, '', 3000);
          this.loadSalesInvoices();
        }
      },
      error: (err: any) => {
        this.sendingSalesToBC[inv.id] = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }

  getSalesStatusBadgeVariant(status: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (status) {
      case 'ready': return 'info';
      case 'sent': return 'success';
      default: return 'outline';
    }
  }

  openSalesInvoicePreview(inv: any): void {
    const dialogRef = this.dialog.open(SalesInvoicePreviewDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { invoiceId: inv.id }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'reverted') {
        this.loadSalesInvoices();
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick() { this.openMenuId = null; }

  togglePostBcMenu(event: Event, id: string) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  // ─── POST-BC STATUS ───

  changeRecruitingPostBcStatus(inv: any, newStatus: string): void {
    const postBcStatus = newStatus || null;
    this.openMenuId = null;
    this.rest.updateRecruitingInvoicePostBcStatus({ invoiceId: inv.ID, postBcStatus }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          inv.post_bc_status = postBcStatus;
        }
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
      }
    });
  }

  changeSalesPostBcStatus(inv: any, newStatus: string): void {
    const postBcStatus = newStatus || null;
    this.openMenuId = null;
    this.rest.updateSalesInvoicePostBcStatus({ invoiceId: inv.id, postBcStatus }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          inv.postBcStatus = postBcStatus;
        }
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
      }
    });
  }

  getPostBcStatusBadgeVariant(status: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (status) {
      case 'sef': return 'info';
      case 'delivered': return 'default';
      case 'paid': return 'success';
      case 'cancelled': return 'warning';
      case 'void': return 'destructive';
      default: return 'outline';
    }
  }

  getPostBcStatusLabel(status: string): string {
    const opt = this.postBcStatusOptions.find(o => o.value === status);
    return opt ? opt.label : '';
  }

  getPostBcStatusTooltip(status: string): string {
    const opt = this.postBcStatusOptions.find(o => o.value === status);
    return opt?.tooltip || '';
  }

  getPostBcStatusColor(status: string): string {
    switch (status) {
      case 'sef': return 'text-blue-600 dark:text-blue-400';
      case 'delivered': return 'text-foreground';
      case 'paid': return 'text-green-600 dark:text-green-400';
      case 'cancelled': return 'text-amber-600 dark:text-amber-400';
      case 'void': return 'text-red-600 dark:text-red-400';
      default: return 'text-green-600 dark:text-green-400';
    }
  }

  getPostBcOptions(inv: any, type: 'recruiting' | 'sales'): typeof this.postBcStatusOptions {
    const isDomestic = type === 'recruiting'
      ? (!inv.feeCurrency?.code || inv.feeCurrency.code === 'RSD')
      : (!inv.currencyCode || inv.currencyCode === 'RSD');
    return this.postBcStatusOptions.filter(o => {
      if (isDomestic && o.value === 'delivered') return false;
      if (!isDomestic && o.value === 'sef') return false;
      return true;
    });
  }

  // ─── EXCEL EXPORT (recruiting only) ───

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
    } else if (calcData.multiCandidate && invoice.lines?.length > 0) {
      this.buildMultiCandidateExcel(invoice, calcData, pos, cur, date);
      return;
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

  private buildMultiCandidateExcel(invoice: any, calcData: any, pos: any, cur: string, date: string): void {
    const wb = XLSX.utils.book_new();
    const feeFormula = this.getFeeConfigLabel(calcData.feeSnapshot);
    const lines: any[] = invoice.lines || [];

    const summary: any[][] = [
      ['Placement Fee Calculation', ''],
      ['', ''],
      ['Position', `${pos.position_number || ''} - ${pos.position_name || ''}`],
      ['Date', date],
      ['Fee Formula', feeFormula],
      ['Candidates', lines.length],
      ['Grouping', calcData.grouping_mode === 'grouped' ? 'Grouped (single line)' : 'Individual lines'],
      ['', ''],
      ['', ''],
      ['#', 'Candidate', 'Entered Salary', 'Salary Type', 'Currency', 'Derived Salary', 'Calculated Fee', 'Final Fee', 'Override'],
    ];

    for (const line of lines) {
      summary.push([
        line.line_number,
        `${line.candidate_first_name} ${line.candidate_last_name}`,
        line.salary_amount,
        line.salaryType?.name || '',
        line.salaryCurrency?.code || '',
        line.derived_salary_for_fee != null ? `${line.derived_salary_for_fee} ${cur}` : '',
        `${line.calculated_fee_amount} ${cur}`,
        `${line.final_fee_amount} ${cur}`,
        line.fee_was_overridden ? 'Yes' : '',
      ]);
    }

    summary.push(
      ['', ''],
      ['Total Calculated Fee', '', '', '', '', '', `${calcData.totalCalculatedFee} ${cur}`, '', ''],
      ['Total Final Fee', '', '', '', '', '', `${calcData.totalFinalFee} ${cur}`, '', ''],
    );

    if (calcData.feeWasOverridden) {
      summary.push(['Fee Override', 'Yes (one or more fees manually adjusted)']);
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    wsSummary['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    for (const line of lines) {
      let lineCalc: any = null;
      if (line.calculation_data) {
        try { lineCalc = typeof line.calculation_data === 'string' ? JSON.parse(line.calculation_data) : line.calculation_data; } catch {}
      }

      const derivedType = lineCalc?.derivedSalaryType || null;
      const derivedLabel = this.getDerivedSalaryLabel(derivedType, pos.salary_type_id);
      const lineCur = lineCalc?.feeCurrencyCode || cur;
      const cRows: any[][] = [
        ['Placement Fee Calculation', ''],
        ['', ''],
        ['Position', `${pos.position_number || ''} - ${pos.position_name || ''}`],
        ['Date', date],
        ['Candidate', `${line.candidate_first_name} ${line.candidate_last_name}`],
        ['', ''],
        ['Entered Salary', line.salary_amount],
        ['Salary Type', line.salaryType?.name || ''],
        ['Currency', line.salaryCurrency?.code || ''],
        [`Derived Salary (${derivedLabel})`, line.derived_salary_for_fee != null ? `${line.derived_salary_for_fee} ${lineCur}` : 'N/A'],
        ['Fee Formula', feeFormula],
        ['', ''],
        ['Calculated Fee', `${line.calculated_fee_amount} ${lineCur}`],
        ['Final Fee Amount', `${line.final_fee_amount} ${lineCur}`],
      ];

      if (line.fee_was_overridden) {
        cRows.push(['Fee Override', 'Yes (manually adjusted)']);
      }

      const calcResults = lineCalc?.calculatorResult;
      if (calcResults) {
        cRows.push(['', ''], ['Salary Calculator Results', ''], ['', 'RSD', 'EUR', 'USD']);
        const labels: Record<string, string> = {
          monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Base Gross', monthlyGrandGross: 'Monthly Grand Gross',
          annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
        };
        for (const [key, label] of Object.entries(labels)) {
          cRows.push([label, calcResults['RSD']?.[key] || '', calcResults['EUR']?.[key] || '', calcResults['USD']?.[key] || '']);
        }
      }

      const exRates = lineCalc?.exchangeRates;
      if (exRates) {
        cRows.push(['', ''], ['Exchange Rates', '']);
        if (exRates.EUR) cRows.push(['1 EUR', `${exRates.EUR} RSD`]);
        if (exRates.USD) cRows.push(['1 USD', `${exRates.USD} RSD`]);
      }

      const wsCandidate = XLSX.utils.aoa_to_sheet(cRows);
      wsCandidate['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];

      const sheetName = `${line.line_number}. ${line.candidate_first_name} ${line.candidate_last_name}`.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, wsCandidate, sheetName);
    }

    XLSX.writeFile(wb, `Placement_${pos.position_number || invoice.ID}_${lines.length}cand_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  private getDerivedSalaryLabel(key: string | null, salaryTypeId?: number): string {
    const map: Record<string, string> = {
      monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Gross', monthlyGrandGross: 'Monthly Grand Gross',
      annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
    };
    if (key && map[key]) return map[key];
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
