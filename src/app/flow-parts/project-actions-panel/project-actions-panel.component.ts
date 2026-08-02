import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { UserService } from '../../services/user.service';
import { CreateProjectInvoiceDialogComponent } from '../../sales-invoices/create-project-invoice-dialog/create-project-invoice-dialog.component';
import { SalesInvoicePreviewDialogComponent } from '../../sales-invoices/sales-invoice-preview-dialog/sales-invoice-preview-dialog.component';
import { EditSalesInvoiceDialogComponent } from '../../invoices/edit-sales-invoice-dialog/edit-sales-invoice-dialog.component';
import { CreateCreditDebitNoteDialogComponent } from '../../sales-invoices/create-credit-debit-note-dialog/create-credit-debit-note-dialog.component';
import { CompleteNoteDialogComponent } from '../../sales-invoices/complete-note-dialog/complete-note-dialog.component';

// Mirrors backend utilities/projectStatus.js
const PROJECT_STATUS = { OPEN: 1, CLOSED: 2 };

@Component({
  selector: 'app-project-actions-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-actions-panel.component.html'
})
export class ProjectActionsPanelComponent implements OnInit {
  @Input() projectId!: number;
  @Input() compact = false;
  @Input() showOpenLink = false;
  @Output() changed = new EventEmitter<void>();

  project: any = null;
  invoices: any[] = [];
  loading = false;
  entityEdit = false;

  openMenuId: string | null = null;
  postBcStatusOptions = [
    { value: '', label: 'BC ✓', tooltip: 'Sent to Business Central' },
    { value: 'sef', label: 'Sent to SEF', tooltip: 'Invoice registered in Serbian e-invoicing system' },
    { value: 'delivered', label: 'Delivered', tooltip: 'Invoice delivered to client' },
    { value: 'paid', label: 'Paid', tooltip: 'Payment received' },
    { value: 'cancelled', label: 'Cancelled', tooltip: 'Invoice cancelled (storno)' },
    { value: 'void', label: 'Void', tooltip: 'Invoice voided / invalid' },
  ];

  constructor(
    private rest: RestService,
    private dialogService: DialogService,
    public userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.projectId) {
      this.load();
      // Any project entity-access level authorizes actions (backend checkAccess ignores level)
      this.userService.hasEntityAccess('project', this.projectId).then(v => this.entityEdit = v);
    }
  }

  load() {
    this.loading = true;
    this.rest.getProjectById(this.projectId).subscribe({
      next: (res: any) => {
        this.project = res.data || null;
        this.invoices = this.project?.invoices || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get isClosed(): boolean {
    return Number(this.project?.status) === PROJECT_STATUS.CLOSED;
  }

  get statusLabel(): string {
    return this.isClosed ? 'Closed' : 'Open';
  }

  get canInvoice(): boolean {
    return this.userService.can('create_project_invoice') || this.entityEdit;
  }

  get canClose(): boolean {
    return this.userService.can('close_project') || this.entityEdit;
  }

  openCreateInvoice() {
    if (!this.project || this.isClosed) return;
    const ref = this.dialog.open(CreateProjectInvoiceDialogComponent, {
      data: { project: this.project },
      maxHeight: '95vh',
      autoFocus: false
    });
    ref.afterClosed().subscribe((created: any) => {
      if (created) {
        this.load();
        this.changed.emit();
      }
    });
  }

  toggleStatus() {
    const target = this.isClosed ? PROJECT_STATUS.OPEN : PROJECT_STATUS.CLOSED;
    const verb = target === PROJECT_STATUS.CLOSED ? 'close' : 'reopen';
    this.dialogService.showChooseDialog(`Are you sure you want to ${verb} project #${this.projectId}?`)
      .afterClosed().subscribe((isYes: any) => {
        if (!isYes) return;
        this.dialogService.showLoader();
        this.rest.changeProjectStatus(this.projectId, target).subscribe({
          next: (res: any) => {
            this.dialogService.closeLoader();
            this.project = res.data || this.project;
            this.invoices = this.project?.invoices || this.invoices;
            this.dialogService.showSnackBar(`Project marked ${target === PROJECT_STATUS.CLOSED ? 'Closed' : 'Open'}`, '', 2500);
            this.changed.emit();
          },
          error: (err: any) => {
            this.dialogService.closeLoader();
            this.dialogService.errorServDialog(err);
          }
        });
      });
  }

  // ─── Invoice row actions (parity with Manual Invoices) ───

  openPreview(inv: any) {
    this.dialog.open(SalesInvoicePreviewDialogComponent, {
      width: '800px', maxWidth: '95vw', data: { invoiceId: inv.id }, autoFocus: false
    }).afterClosed().subscribe((r: any) => { if (r?.action === 'reverted') this.load(); });
  }

  openEditDialog(inv: any) {
    this.dialog.open(EditSalesInvoiceDialogComponent, {
      width: '860px', maxWidth: '95vw', data: { invoice: inv }, autoFocus: false
    }).afterClosed().subscribe((r: any) => { if (r) this.load(); });
  }

  markReady(inv: any) {
    if (!window.confirm(`Mark invoice ${inv.invoiceNo} as ready? It will be assigned a real invoice number.`)) return;
    this.rest.changeStatusSalesInvoice({ invoiceId: inv.id, newStatus: 'ready' }).subscribe({
      next: (res: any) => { if (res.status === 200) { this.dialogService.showSnackBar(`Invoice marked as ready: ${res.data?.invoiceNo || ''}`, '', 3000); this.load(); } },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  revertToDraft(inv: any) {
    if (!window.confirm(`Revert invoice ${inv.invoiceNo} back to draft?`)) return;
    this.rest.changeStatusSalesInvoice({ invoiceId: inv.id, newStatus: 'draft' }).subscribe({
      next: (res: any) => { if (res.status === 200) { this.dialogService.showSnackBar('Invoice reverted to draft', '', 3000); this.load(); } },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  duplicateInvoice(inv: any) {
    this.rest.duplicateSalesInvoice({ invoiceId: inv.id }).subscribe({
      next: (res: any) => { if (res.status === 200) { this.dialogService.showSnackBar(`Invoice duplicated as ${res.data?.invoiceNo || 'new draft'}`, '', 3000); this.load(); } },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  deleteInvoice(inv: any) {
    if (!window.confirm(`Delete draft invoice ${inv.invoiceNo}? This cannot be undone.`)) return;
    this.rest.deleteSalesInvoice({ invoiceId: inv.id }).subscribe({
      next: (res: any) => { if (res.status === 200) { this.dialogService.showSnackBar('Invoice deleted', '', 3000); this.load(); } },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  isCreditMemo(inv: any): boolean {
    return inv.documentType === 'Credit Memo';
  }

  // ─── Row menu + post-BC status (parity with Manual Invoices) ───

  @HostListener('document:click')
  onDocumentClick() { this.openMenuId = null; }

  togglePostBcMenu(event: Event, id: string) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  changeSalesPostBcStatus(inv: any, newStatus: string): void {
    const postBcStatus = newStatus || null;
    this.openMenuId = null;
    this.rest.updateSalesInvoicePostBcStatus({ invoiceId: inv.id, postBcStatus }).subscribe({
      next: (res: any) => { if (res.status === 200) inv.postBcStatus = postBcStatus; },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
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

  getPostBcOptions(inv: any): typeof this.postBcStatusOptions {
    const isDomestic = !inv.currencyCode || inv.currencyCode === 'RSD';
    return this.postBcStatusOptions.filter(o => {
      if (isDomestic && o.value === 'delivered') return false;
      if (!isDomestic && o.value === 'sef') return false;
      return true;
    });
  }

  createCreditNote(inv: any) {
    this.dialog.open(CreateCreditDebitNoteDialogComponent, {
      width: '700px', maxWidth: '95vw', data: { invoice: inv, noteType: 'credit' }
    }).afterClosed().subscribe((r: any) => { if (r?.created) this.load(); });
  }

  createDebitNote(inv: any) {
    this.dialog.open(CreateCreditDebitNoteDialogComponent, {
      width: '700px', maxWidth: '95vw', data: { invoice: inv, noteType: 'debit' }
    }).afterClosed().subscribe((r: any) => { if (r?.created) this.load(); });
  }

  openCompleteNoteDialog(note: any) {
    this.dialog.open(CompleteNoteDialogComponent, {
      width: '720px', data: { note }
    }).afterClosed().subscribe((r: any) => { if (r?.saved) this.load(); });
  }
}
