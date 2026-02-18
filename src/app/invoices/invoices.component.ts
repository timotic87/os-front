import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule, DecimalPipe } from '@angular/common';
import { RestService } from '../services/rest.service';
import { UserService } from '../services/user.service';
import { DialogService } from '../services/dialog.service';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../shared/components/ui/card/card.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';

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

  constructor(
    private rest: RestService,
    public userService: UserService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadLegalEntities();
    this.loadInvoices();
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
}
