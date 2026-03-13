import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DatePipe, CommonModule, DecimalPipe } from '@angular/common';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { RestService } from '../services/rest.service';
import { UserService } from '../services/user.service';
import { DialogService } from '../services/dialog.service';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../shared/components/ui/card/card.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';
import { SalesInvoicePreviewDialogComponent } from './sales-invoice-preview-dialog/sales-invoice-preview-dialog.component';

@Component({
  selector: 'app-sales-invoices',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './sales-invoices.component.html',
  styleUrl: './sales-invoices.component.css'
})
export class SalesInvoicesComponent implements OnInit {

  mode: 'list' | 'create' | 'edit' = 'list';

  // List state
  invoices: any[] = [];
  totalCount = 0;
  pageSize = 20;
  offset = 0;
  loading = true;
  filterSearch = '';
  filterStatus = '';
  Math = Math;

  // Form state
  invoiceForm!: FormGroup;
  legalEntities: any[] = [];
  services: any[] = [];
  costCenters: any[] = [];
  filteredCostCenters: any[] = [];
  currencies: any[] = [];
  vatPostingGroups: any[] = [];
  clientSuggestions: any[] = [];
  creating = false;
  editingInvoice: any = null;

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
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.initForm();
  }

  // ─── LIST MODE ───

  loadInvoices() {
    this.loading = true;
    this.rest.getSalesInvoices({
      offset: this.offset,
      limit: this.pageSize,
      status: this.filterStatus || undefined,
      customerSearch: this.filterSearch || undefined
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
    this.filterStatus = '';
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

  getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (status) {
      case 'draft': return 'secondary';
      case 'ready': return 'info';
      case 'sent': return 'success';
      default: return 'outline';
    }
  }

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

  // ─── CREATE MODE ───

  switchToCreate() {
    this.mode = 'create';
    this.editingInvoice = null;
    this.loadDropdowns();
    this.initForm();
  }

  switchToList() {
    this.mode = 'list';
    this.editingInvoice = null;
    this.loadInvoices();
  }

  // ─── EDIT MODE ───

  switchToEdit(inv: any) {
    this.editingInvoice = inv;
    this.mode = 'edit';
    this.loadDropdowns();
    this.initForm();

    // Fetch full invoice with lines
    this.rest.getSalesInvoiceByID(inv.id).subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.editingInvoice = res.data;
          this.populateFormFromInvoice(res.data);
        }
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
        this.switchToList();
      }
    });
  }

  private populateFormFromInvoice(inv: any) {
    this.invoiceForm.patchValue({
      legalEntityId: inv.legalEntityId,
      clientSearch: inv.customerName || inv.client?.customerName || '',
      clientId: inv.clientId,
      serviceId: inv.serviceId,
      costCenterSearch: inv.costCenter ? `${inv.costCenter.code} - ${inv.costCenter.name}` : '',
      costCenterId: inv.costCenterId,
      currencyCode: inv.currencyCode || '',
      issueDate: inv.issueDate ? inv.issueDate.split('T')[0] : '',
      transactionDate: inv.transactionDate ? inv.transactionDate.split('T')[0] : '',
      paymentDueDays: inv.paymentDueDays || 30,
      description: inv.description || ''
    });

    // Clear and re-add lines
    this.lines.clear();
    if (inv.lines && inv.lines.length > 0) {
      for (const line of inv.lines) {
        this.lines.push(this.fb.group({
          description: [line.description || ''],
          quantity: [line.quantity || 1, [Validators.required, Validators.min(0.01)]],
          unitPriceExclVAT: [line.unitPriceExclVAT || 0, [Validators.required, Validators.min(0)]],
          vatProdPostingGroup: [line.vatProdPostingGroup || '0']
        }));
      }
    } else {
      this.addLine();
    }
  }

  // ─── SAVE (create or update) ───

  saveInvoice() {
    if (!this.invoiceForm.get('legalEntityId')?.value) {
      this.dialogService.showSnackBar('Legal Entity is required', '', 3000);
      return;
    }
    if (this.lines.length === 0) {
      this.dialogService.showSnackBar('At least one line is required', '', 3000);
      return;
    }

    this.creating = true;
    const formVal = this.invoiceForm.value;

    const payload: any = {
      legalEntityId: formVal.legalEntityId,
      clientId: formVal.clientId || null,
      serviceId: formVal.serviceId || null,
      costCenterId: formVal.costCenterId || null,
      issueDate: formVal.issueDate || null,
      transactionDate: formVal.transactionDate || null,
      paymentDueDays: formVal.paymentDueDays || null,
      currencyCode: formVal.currencyCode || null,
      description: formVal.description || null,
      lines: formVal.lines.map((l: any) => ({
        description: l.description || null,
        quantity: l.quantity,
        unitPriceExclVAT: l.unitPriceExclVAT,
        vatProdPostingGroup: l.vatProdPostingGroup || '0'
      }))
    };

    if (this.mode === 'edit' && this.editingInvoice) {
      payload.invoiceId = this.editingInvoice.id;
      this.rest.updateSalesInvoice(payload).subscribe({
        next: (res: any) => {
          this.creating = false;
          if (res.status === 200) {
            this.dialogService.showSnackBar(`Invoice ${res.data?.invoiceNo || ''} updated successfully`, '', 3000);
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.creating = false;
          this.dialogService.errorServDialog(err);
        }
      });
    } else {
      this.rest.createSalesInvoice(payload).subscribe({
        next: (res: any) => {
          this.creating = false;
          if (res.status === 201 || res.status === 200) {
            this.dialogService.showSnackBar(`Invoice ${res.data?.invoiceNo || ''} created successfully`, '', 3000);
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.creating = false;
          this.dialogService.errorServDialog(err);
        }
      });
    }
  }

  // ─── ACTIONS ───

  deleteInvoice(inv: any) {
    if (!window.confirm(`Delete draft invoice ${inv.invoiceNo}? This cannot be undone.`)) return;

    this.rest.deleteSalesInvoice({ invoiceId: inv.id }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Invoice deleted', '', 3000);
          this.loadInvoices();
        }
      },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  markReady(inv: any) {
    if (!window.confirm(`Mark invoice ${inv.invoiceNo} as ready? It will be assigned a real invoice number.`)) return;

    this.rest.changeStatusSalesInvoice({ invoiceId: inv.id, newStatus: 'ready' }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar(`Invoice marked as ready: ${res.data?.invoiceNo || ''}`, '', 3000);
          this.loadInvoices();
        }
      },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  revertToDraft(inv: any) {
    if (!window.confirm(`Revert invoice ${inv.invoiceNo} back to draft?`)) return;

    this.rest.changeStatusSalesInvoice({ invoiceId: inv.id, newStatus: 'draft' }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Invoice reverted to draft', '', 3000);
          this.loadInvoices();
        }
      },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  duplicateInvoice(inv: any) {
    this.rest.duplicateSalesInvoice({ invoiceId: inv.id }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar(`Invoice duplicated as ${res.data?.invoiceNo || 'new draft'}`, '', 3000);
          this.loadInvoices();
        }
      },
      error: (err: any) => this.dialogService.errorServDialog(err)
    });
  }

  showRevertNote(inv: any) {
    const who = inv.reverter ? `${inv.reverter.firstName} ${inv.reverter.lastName}` : 'Someone';
    this.dialog.open(RevertNoteDialogComponent, {
      width: '420px',
      data: { note: inv.revertNote, revertedBy: who }
    });
  }

  openPreview(inv: any) {
    const dialogRef = this.dialog.open(SalesInvoicePreviewDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { invoiceId: inv.id }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'reverted') {
        this.loadInvoices();
      }
    });
  }

  // ─── FORM HELPERS ───

  private loadDropdowns() {
    this.rest.getLEList().subscribe({
      next: (res: any) => {
        this.legalEntities = res.status === 200 ? res.data : [];
      }
    });
    this.rest.getServices().subscribe({
      next: (res: any) => {
        this.services = res.status === 200 ? res.data : [];
      }
    });
    this.rest.getCostCenters().subscribe({
      next: (res: any) => {
        this.costCenters = res.status === 200 ? res.data : [];
      }
    });
    this.rest.getCurrencyList().subscribe({
      next: (res: any) => {
        this.currencies = res.status === 200 ? res.data : [];
      }
    });
    this.rest.getVatPostingGroups().subscribe({
      next: (res: any) => {
        this.vatPostingGroups = Array.isArray(res) ? res : [];
      }
    });
  }

  private getTodayString(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  private initForm() {
    const today = this.getTodayString();
    this.invoiceForm = this.fb.group({
      legalEntityId: [null, Validators.required],
      clientSearch: [''],
      clientId: [null],
      serviceId: [null],
      costCenterSearch: [''],
      costCenterId: [null],
      currencyCode: [''],
      issueDate: [today],
      transactionDate: [today],
      paymentDueDays: [30],
      description: [''],
      lines: this.fb.array([])
    });

    this.filteredCostCenters = [];
    this.addLine();
  }

  get lines(): FormArray {
    return this.invoiceForm.get('lines') as FormArray;
  }

  addLine() {
    const defaultVat = this.vatPostingGroups.find(v => v.is_default)?.code || '0';
    this.lines.push(this.fb.group({
      description: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPriceExclVAT: [0, [Validators.required, Validators.min(0)]],
      vatProdPostingGroup: [defaultVat]
    }));
  }

  removeLine(index: number) {
    this.lines.removeAt(index);
  }

  getLineAmount(index: number): number {
    const line = this.lines.at(index);
    const qty = parseFloat(line.get('quantity')?.value) || 0;
    const price = parseFloat(line.get('unitPriceExclVAT')?.value) || 0;
    return Math.round(qty * price * 100) / 100;
  }

  get totalAmount(): number {
    let total = 0;
    for (let i = 0; i < this.lines.length; i++) {
      total += this.getLineAmount(i);
    }
    return Math.round(total * 100) / 100;
  }

  get calculatedDueDate(): string {
    const issueDate = this.invoiceForm.get('issueDate')?.value;
    const days = this.invoiceForm.get('paymentDueDays')?.value;
    if (!issueDate || !days) return '';
    const d = new Date(issueDate);
    d.setDate(d.getDate() + parseInt(days));
    return d.toISOString().split('T')[0];
  }

  // Client autocomplete
  onClientSearch(event: any) {
    const val = event.target.value;
    if (!val || val.length < 2) {
      this.clientSuggestions = [];
      return;
    }
    this.rest.getClientsByName(val).subscribe({
      next: (res: any) => {
        this.clientSuggestions = res.status === 200 ? res.data : [];
      }
    });
  }

  selectClient(client: any) {
    this.invoiceForm.patchValue({
      clientId: client.id,
      clientSearch: client.customerName
    });
    this.clientSuggestions = [];
  }

  displayClient(client: any): string {
    return client?.customerName || '';
  }

  // Cost Center autocomplete
  onCostCenterSearch(event: any) {
    const val = (event.target.value || '').toLowerCase().trim();
    if (!val) {
      this.filteredCostCenters = [];
      return;
    }
    this.filteredCostCenters = this.costCenters.filter(cc =>
      cc.code.toLowerCase().includes(val) || cc.name.toLowerCase().includes(val)
    );
  }

  selectCostCenter(cc: any) {
    this.invoiceForm.patchValue({
      costCenterId: cc.ID,
      costCenterSearch: `${cc.code} - ${cc.name}`
    });
    this.filteredCostCenters = [];
  }

  clearCostCenter() {
    this.invoiceForm.patchValue({
      costCenterId: null,
      costCenterSearch: ''
    });
    this.filteredCostCenters = [];
  }
}

@Component({
  selector: 'app-revert-note-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div style="padding: 24px; max-width: 400px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <svg style="width: 20px; height: 20px; color: #d97706;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"/>
        </svg>
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: hsl(var(--foreground));">Revert Note</h3>
      </div>
      <p style="margin: 0 0 12px; font-size: 14px; color: hsl(var(--foreground)); white-space: pre-wrap; line-height: 1.5;">{{ data.note }}</p>
      <p style="margin: 0 0 20px; font-size: 12px; color: hsl(var(--muted-foreground));">— {{ data.revertedBy }}</p>
      <div style="display: flex; justify-content: flex-end;">
        <button (click)="dialogRef.close()"
                style="height: 36px; padding: 0 16px; border-radius: 6px; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); color: hsl(var(--foreground)); font-size: 14px; cursor: pointer;">
          Close
        </button>
      </div>
    </div>
  `
})
export class RevertNoteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RevertNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { note: string; revertedBy: string }
  ) {}
}
