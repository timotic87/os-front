import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { LabelComponent } from '../../shared/components/ui/label/label.component';
import { TextareaComponent } from '../../shared/components/ui/textarea/textarea.component';

@Component({
  selector: 'app-edit-sales-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatAutocompleteModule,
    ButtonComponent,
    InputComponent,
    LabelComponent,
    TextareaComponent
  ],
  templateUrl: './edit-sales-invoice-dialog.component.html'
})
export class EditSalesInvoiceDialogComponent implements OnInit {

  form!: FormGroup;
  legalEntities: any[] = [];
  services: any[] = [];
  costCenters: any[] = [];
  filteredCostCenters: any[] = [];
  currencies: any[] = [];
  vatPostingGroups: any[] = [];
  clientSuggestions: any[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private dialogService: DialogService,
    public dialogRef: MatDialogRef<EditSalesInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: any }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      legalEntityId: [null, Validators.required],
      clientSearch: [''],
      clientId: [null],
      serviceId: [null],
      costCenterSearch: [''],
      costCenterId: [null],
      currencyCode: [''],
      issueDate: ['', Validators.required],
      transactionDate: ['', Validators.required],
      paymentDueDays: [30],
      description: [''],
      poNo: [''],
      messageToFinance: [''],
      lines: this.fb.array([])
    });

    this.loadDropdowns(() => this.populateForm(this.data.invoice));
  }

  private loadDropdowns(done?: () => void) {
    let loaded = 0;
    const check = () => { if (++loaded === 5 && done) done(); };

    this.rest.getLEList().subscribe({ next: (r: any) => { this.legalEntities = r.status === 200 ? r.data : []; check(); } });
    this.rest.getServices().subscribe({ next: (r: any) => { this.services = r.status === 200 ? r.data : []; check(); } });
    this.rest.getCostCenters().subscribe({ next: (r: any) => { this.costCenters = r.status === 200 ? r.data : []; check(); } });
    this.rest.getCurrencyList().subscribe({ next: (r: any) => { this.currencies = r.status === 200 ? r.data : []; check(); } });
    this.rest.getVatPostingGroups().subscribe({ next: (r: any) => { this.vatPostingGroups = Array.isArray(r) ? r : (r.data || []); check(); } });
  }

  private populateForm(inv: any) {
    this.form.patchValue({
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
      description: inv.description || '',
      poNo: inv.poNo || '',
      messageToFinance: inv.messageToFinance || ''
    });

    // Fetch full invoice with lines
    this.rest.getSalesInvoiceByID(inv.id).subscribe({
      next: (res: any) => {
        const full = res.data || inv;
        this.lines.clear();
        const linesToAdd = full.lines?.length ? full.lines : inv.lines || [];
        if (linesToAdd.length) {
          for (const line of linesToAdd) {
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
      },
      error: () => { if (!this.lines.length) this.addLine(); }
    });
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

  onClientSearch(event: any) {
    const val = event.target.value;
    if (!val || val.length < 2) { this.clientSuggestions = []; return; }
    this.rest.getClientsByName(val).subscribe({
      next: (res: any) => { this.clientSuggestions = res.status === 200 ? res.data : []; }
    });
  }

  selectClient(client: any) {
    this.form.patchValue({ clientId: client.id, clientSearch: client.customerName });
    this.clientSuggestions = [];
  }

  onCostCenterSearch(event: any) {
    const val = (event.target.value || '').toLowerCase().trim();
    this.filteredCostCenters = val ? this.costCenters.filter((cc: any) =>
      cc.code.toLowerCase().includes(val) || cc.name.toLowerCase().includes(val)
    ) : [];
  }

  selectCostCenter(cc: any) {
    this.form.patchValue({ costCenterId: cc.id, costCenterSearch: `${cc.code} - ${cc.name}` });
    this.filteredCostCenters = [];
  }

  submit() {
    if (!this.form.get('legalEntityId')?.value) {
      this.dialogService.showSnackBar('Legal Entity is required', '', 3000);
      return;
    }
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
      invoiceId: this.data.invoice.id,
      legalEntityId: val.legalEntityId,
      clientId: val.clientId || null,
      serviceId: val.serviceId || null,
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

    this.rest.updateSalesInvoice(payload).subscribe({
      next: (res: any) => {
        this.dialogService.showSnackBar(`Invoice ${res.data?.invoiceNo || ''} updated`, '', 2500);
        this.dialogRef.close(res.data);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }
}
