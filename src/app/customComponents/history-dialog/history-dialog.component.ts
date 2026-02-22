import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService } from '../../services/rest.service';

export interface HistoryDialogData {
  entity: string;
  entityID: number;
  title: string;
  additionalEntities?: { entity: string; entityIDs: number[] }[];
}

@Component({
  selector: 'app-history-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history-dialog.component.html'
})
export class HistoryDialogComponent implements OnInit {

  logs: any[] = [];
  filteredLogs: any[] = [];
  loading = true;
  expandedRow: number | null = null;
  copiedLogId: number | null = null;

  // Filters
  filterAction = '';
  filterUser = '';
  filterDateFrom = '';
  filterDateTo = '';

  // Filter options
  actionOptions: string[] = [];
  userOptions: { id: number; name: string }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HistoryDialogData,
    private dialogRef: MatDialogRef<HistoryDialogComponent>,
    private rest: RestService
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;

    if (this.data.additionalEntities && this.data.additionalEntities.length > 0) {
      // Multi-entity query: combine main entity + additional entities
      const queries = [
        { entity: this.data.entity, entityIDs: [this.data.entityID] },
        ...this.data.additionalEntities.filter(e => e.entityIDs.length > 0)
      ];
      this.rest.getAuditLogsByMultipleEntities(queries).subscribe({
        next: (res: any) => {
          this.logs = res.data || [];
          this.buildFilterOptions();
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.rest.getAuditLogsByEntityAndEntityID({ entity: this.data.entity, entityID: this.data.entityID }).subscribe({
        next: (res: any) => {
          this.logs = res.data || [];
          this.buildFilterOptions();
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  buildFilterOptions() {
    const actionSet = new Set<string>();
    const userMap = new Map<number, string>();

    for (const log of this.logs) {
      if (log.action) actionSet.add(log.action);
      if (log.user) {
        userMap.set(log.user.id, `${log.user.firstName} ${log.user.lastName}`);
      }
    }

    this.actionOptions = Array.from(actionSet).sort();
    this.userOptions = Array.from(userMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }

  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      if (this.filterAction && log.action !== this.filterAction) return false;
      if (this.filterUser && log.user?.id !== parseInt(this.filterUser)) return false;
      if (this.filterDateFrom) {
        const from = new Date(this.filterDateFrom);
        if (new Date(log.created) < from) return false;
      }
      if (this.filterDateTo) {
        const to = new Date(this.filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(log.created) > to) return false;
      }
      return true;
    });
    this.expandedRow = null;
  }

  clearFilters() {
    this.filterAction = '';
    this.filterUser = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFilters();
  }

  get hasFilters(): boolean {
    return !!(this.filterAction || this.filterUser || this.filterDateFrom || this.filterDateTo);
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
    if (log.previousData) data.previousData = JSON.parse(log.previousData);
    if (log.newData) data.newData = JSON.parse(log.newData);
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    this.copiedLogId = log.ID;
    setTimeout(() => this.copiedLogId = null, 2000);
  }

  formatEntityName(entity: string): string {
    if (!entity) return '-';
    // Convert e.g. "RecruitingPosition" → "Position", "RecruitingOrder" → "Order"
    return entity.replace('Recruiting', '').replace('Assignment', ' Assignment');
  }

  close() {
    this.dialogRef.close();
  }
}
