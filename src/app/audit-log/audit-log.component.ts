import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService } from '../services/rest.service';
import { UserService } from '../services/user.service';
import { DialogService } from '../services/dialog.service';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../shared/components/ui/card/card.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent
  ],
  templateUrl: './audit-log.component.html'
})
export class AuditLogComponent implements OnInit {

  logs: any[] = [];
  totalCount = 0;
  pageSize = 25;
  offset = 0;
  loading = true;

  // Filters
  filterEntity = '';
  filterEntityId = '';
  filterAction = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterSearch = '';

  // Filter options from backend
  entityOptions: string[] = [];
  actionOptions: string[] = [];

  // Expanded row
  expandedRow: number | null = null;
  copiedLogId: number | null = null;

  Math = Math;

  constructor(
    private rest: RestService,
    public userService: UserService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadLogs();
  }

  loadFilterOptions() {
    this.rest.getAuditLogFilterOptions().subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.entityOptions = res.data.entities || [];
          this.actionOptions = res.data.actions || [];
        }
      }
    });
  }

  loadLogs() {
    this.loading = true;
    const params: any = {
      offset: this.offset,
      limit: this.pageSize
    };
    if (this.filterEntity) params.entity = this.filterEntity;
    if (this.filterEntityId) params.entityID = this.filterEntityId;
    if (this.filterAction) params.action = this.filterAction;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;
    if (this.filterSearch) params.search = this.filterSearch;

    this.rest.getAuditLogs(params).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.logs = res.data || [];
          this.totalCount = res.totalCount || 0;
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
    this.expandedRow = null;
    this.loadLogs();
  }

  clearFilters() {
    this.filterEntity = '';
    this.filterEntityId = '';
    this.filterAction = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterSearch = '';
    this.offset = 0;
    this.expandedRow = null;
    this.loadLogs();
  }

  get hasFilters(): boolean {
    return !!(this.filterEntity || this.filterEntityId || this.filterAction || this.filterDateFrom || this.filterDateTo || this.filterSearch);
  }

  nextPage() {
    if (this.offset + this.pageSize < this.totalCount) {
      this.offset += this.pageSize;
      this.expandedRow = null;
      this.loadLogs();
    }
  }

  prevPage() {
    if (this.offset > 0) {
      this.offset = Math.max(0, this.offset - this.pageSize);
      this.expandedRow = null;
      this.loadLogs();
    }
  }

  get currentPage(): number {
    return Math.floor(this.offset / this.pageSize) + 1;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  toggleRow(id: number) {
    this.expandedRow = this.expandedRow === id ? null : id;
  }

  private unwrap(obj: any): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const keys = Object.keys(obj);
    if (keys.length === 1 && typeof obj[keys[0]] === 'object' && obj[keys[0]] !== null && !Array.isArray(obj[keys[0]])) {
      return obj[keys[0]];
    }
    return obj;
  }

  getChangedFields(log: any): { field: string; from: any; to: any }[] {
    try {
      const rawPrev = log.previousData ? JSON.parse(log.previousData) : null;
      const rawNext = log.newData ? JSON.parse(log.newData) : null;
      const prev = this.unwrap((rawPrev && typeof rawPrev === 'object') ? rawPrev : {});
      const next = this.unwrap((rawNext && typeof rawNext === 'object') ? rawNext : {});

      const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
      if (allKeys.size === 0) return [];

      const changes: { field: string; from: any; to: any }[] = [];

      for (const key of allKeys) {
        const fromVal = prev?.[key];
        const toVal = next?.[key];
        if (JSON.stringify(fromVal) !== JSON.stringify(toVal)) {
          changes.push({ field: key, from: this.formatValue(fromVal), to: this.formatValue(toVal) });
        }
      }
      return changes;
    } catch {
      return [];
    }
  }

  hasExpandableData(log: any): boolean {
    return !!(log.previousData || log.newData);
  }

  formatValue(val: any): string {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  formatJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  copyJson(log: any) {
    const data: any = {};
    try { if (log.previousData) data.previousData = JSON.parse(log.previousData); } catch {}
    try { if (log.newData) data.newData = JSON.parse(log.newData); } catch {}
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    this.copiedLogId = log.ID;
    setTimeout(() => this.copiedLogId = null, 2000);
  }
}
