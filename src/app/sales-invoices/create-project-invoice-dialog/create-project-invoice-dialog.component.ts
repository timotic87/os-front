import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-create-project-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    ButtonComponent
  ],
  templateUrl: './create-project-invoice-dialog.component.html'
})
export class CreateProjectInvoiceDialogComponent implements OnInit {

  form!: FormGroup;
  costCenters: any[] = [];
  filteredCostCenters: any[] = [];
  currencies: any[] = [];
  vatPostingGroups: any[] = [];
  isSubmitting = false;

  // Locked, derived from the project's deal
  projectId!: number;
  clientId: number | null = null;
  legalEntityId: number | null = null;
  serviceId: number | null = null;
  clientName = '';
  legalEntityName = '';
  serviceName = '';

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<CreateProjectInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project: any }
  ) {}

  ngOnInit(): void {
    const project = this.data.project || {};
    const deal = project.Deal || project.deal || {};
    this.projectId = project.ID;
    this.legalEntityId = deal.legalEntityID ?? null;
    this.clientId = deal.clientID ?? null;
    this.serviceId = deal.serviceID ?? null;
    this.clientName = deal.client?.customerName || '—';
    this.legalEntityName = deal.legalEntity?.shortName || deal.legalEntity?.name || '—';
    this.serviceName = deal.service?.name || '—';

    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      costCenterSearch: [''],
      costCenterId: [null],
      currencyCode: [''],
      issueDate: [today, Validators.required],
      transactionDate: [today, Validators.required],
      paymentDueDays: [30],
      description: [''],
      poNo: [''],
      messageToFinance: [''],
      lines: this.fb.array([])
    });

    this.loadDropdowns(() => this.addLine());
  }

  private loadDropdowns(done?: () => void) {
    let loaded = 0;
    const check = () => { if (++loaded === 3 && done) done(); };
    this.rest.getCostCenters().subscribe({ next: (r: any) => { this.costCenters = r.status === 200 ? r.data : []; check(); }, error: () => check() });
    this.rest.getCurrencyList().subscribe({ next: (r: any) => { this.currencies = r.status === 200 ? r.data : []; check(); }, error: () => check() });
    this.rest.getVatPostingGroups().subscribe({ next: (r: any) => { this.vatPostingGroups = Array.isArray(r) ? r : (r.data || []); check(); }, error: () => check() });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  addLine() {
    const defaultVat = this.vatPostingGroups.find((v: any) => v.is_default)?.code || '0';
    this.lines.push(this.fb.group({
      description: [''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPriceExclVAT: [0, [Validators.required, Validators.min(0)]],
      vatProdPostingGroup: [defaultVat]
    }));
  }

  removeLine(index: number) {
    if (this.lines.length > 1) this.lines.removeAt(index);
  }

  getLineAmount(index: number): number {
    const line = this.lines.at(index);
    return Math.round((parseFloat(line.get('quantity')?.value) || 0) * (parseFloat(line.get('unitPriceExclVAT')?.value) || 0) * 100) / 100;
  }

  get totalAmount(): number {
    return this.lines.controls.reduce((sum, _, i) => sum + this.getLineAmount(i), 0);
  }

  get selectedCurrency(): string {
    return this.form.get('currencyCode')?.value || '';
  }

  get calculatedDueDate(): string {
    const d = this.form.get('issueDate')?.value;
    const days = this.form.get('paymentDueDays')?.value;
    if (!d || !days) return '';
    const dt = new Date(d);
    dt.setDate(dt.getDate() + parseInt(days));
    return dt.toISOString().split('T')[0];
  }

  onCostCenterSearch(event: any) {
    const val = (event.target.value || '').toLowerCase().trim();
    this.filteredCostCenters = val ? this.costCenters.filter((cc: any) =>
      cc.code.toLowerCase().includes(val) || cc.name.toLowerCase().includes(val)
    ) : [];
  }

  selectCostCenter(cc: any) {
    this.form.patchValue({ costCenterId: cc.ID ?? cc.id, costCenterSearch: `${cc.code} - ${cc.name}` });
    this.filteredCostCenters = [];
  }

  submit() {
    if (!this.form.get('issueDate')?.value) {
      this.dialogService.showSnackBar('Issue Date is required', '', 3000);
      return;
    }
    if (!this.form.get('transactionDate')?.value) {
      this.dialogService.showSnackBar('Transaction Date is required', '', 3000);
      return;
    }
    if (!this.lines.length) {
      this.dialogService.showSnackBar('At least one line is required', '', 3000);
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const val = this.form.value;
    const payload = {
      projectId: this.projectId,
      legalEntityId: this.legalEntityId,
      clientId: this.clientId,
      serviceId: this.serviceId,
      costCenterId: val.costCenterId || null,
      issueDate: val.issueDate || null,
      transactionDate: val.transactionDate || null,
      paymentDueDays: val.paymentDueDays || null,
      currencyCode: val.currencyCode || null,
      description: val.description || null,
      poNo: val.poNo || null,
      messageToFinance: val.messageToFinance ?? null,
      lines: val.lines.map((l: any) => ({
        description: l.description || null,
        quantity: l.quantity,
        unitPriceExclVAT: l.unitPriceExclVAT,
        vatProdPostingGroup: l.vatProdPostingGroup || '0'
      }))
    };

    this.rest.createSalesInvoice(payload).subscribe({
      next: (res: any) => {
        this.dialogService.showSnackBar(`Invoice ${res.data?.invoiceNo || ''} created`, '', 2500);
        this.dialogRef.close(res.data);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }
}
