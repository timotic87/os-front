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

  // Tab state
  activeTab: 'sales' | 'recruiting' = 'sales';

  // Sales invoices state
  invoices: any[] = [];
  totalCount = 0;
  pageSize = 20;
  offset = 0;
  loading = true;

  // Filters
  filterStatus = '';
  filterLegalEntityId: number | null = null;
  filterSearch = '';

  legalEntities: any[] = [];
  Math = Math;

  statusOptions = [
    { value: '', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'error', label: 'Error' }
  ];

  // Recruiting invoices state
  recruitingInvoices: any[] = [];
  recruitingTotalCount = 0;
  recruitingOffset = 0;
  recruitingLoading = false;
  recruitingSearch = '';

  constructor(
    private rest: RestService,
    public userService: UserService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadLegalEntities();
    this.loadInvoices();
  }

  switchTab(tab: 'sales' | 'recruiting') {
    this.activeTab = tab;
    if (tab === 'recruiting') {
      this.loadRecruitingInvoices();
    }
  }

  loadLegalEntities() {
    this.rest.getLEList().subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.legalEntities = res.data;
        }
      }
    });
  }

  loadInvoices() {
    this.loading = true;
    const filters: any = {
      offset: this.offset,
      limit: this.pageSize
    };
    if (this.filterStatus) filters.status = this.filterStatus;
    if (this.filterLegalEntityId) filters.legalEntityId = this.filterLegalEntityId;
    if (this.filterSearch) filters.customerSearch = this.filterSearch;

    this.rest.getSalesInvoices(filters).subscribe({
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
    this.filterStatus = '';
    this.filterLegalEntityId = null;
    this.filterSearch = '';
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

  getStatusClass(status: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'info';
      case 'confirmed': return 'success';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  }

  // Recruiting invoices methods
  loadRecruitingInvoices() {
    this.recruitingLoading = true;
    this.rest.getApprovedRecruitingInvoices({
      offset: this.recruitingOffset,
      limit: this.pageSize,
      search: this.recruitingSearch || undefined
    }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.recruitingInvoices = res.data;
          this.recruitingTotalCount = res.totalCount;
        }
        this.recruitingLoading = false;
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
        this.recruitingLoading = false;
      }
    });
  }

  recruitingNextPage() {
    if (this.recruitingOffset + this.pageSize < this.recruitingTotalCount) {
      this.recruitingOffset += this.pageSize;
      this.loadRecruitingInvoices();
    }
  }

  recruitingPrevPage() {
    if (this.recruitingOffset > 0) {
      this.recruitingOffset = Math.max(0, this.recruitingOffset - this.pageSize);
      this.loadRecruitingInvoices();
    }
  }

  get recruitingCurrentPage(): number {
    return Math.floor(this.recruitingOffset / this.pageSize) + 1;
  }

  get recruitingTotalPages(): number {
    return Math.ceil(this.recruitingTotalCount / this.pageSize) || 1;
  }

  applyRecruitingSearch() {
    this.recruitingOffset = 0;
    this.loadRecruitingInvoices();
  }

  clearRecruitingSearch() {
    this.recruitingSearch = '';
    this.recruitingOffset = 0;
    this.loadRecruitingInvoices();
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

  exportRecruitingInvoice(inv: any): void {
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

    const typeLabel = invoice.invoice_type === 'admin_fee' ? 'Admin Fee' :
                      invoice.invoice_type === 'placement' ? 'Placement Fee' : 'Cancel Fee';

    rows.push(
      [`${typeLabel} Calculation`, ''],
      ['', ''],
      ['Position', `${pos.position_number || ''} - ${pos.position_name || ''}`],
      ['Date', date],
      ['', ''],
      ['Calculated Fee', `${calcData.calculatedFee} ${cur}`],
      ['Final Fee Amount', `${calcData.finalFee} ${cur}`],
    );

    if (invoice.candidate_first_name) {
      rows.push(['Candidate', `${invoice.candidate_first_name} ${invoice.candidate_last_name}`]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Calculation');

    const typeSlug = invoice.invoice_type === 'admin_fee' ? 'AdminFee' :
                     invoice.invoice_type === 'placement' ? 'Placement' : 'CancelFee';
    XLSX.writeFile(wb, `${typeSlug}_${pos.position_number || invoice.ID}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
