import {Component, Inject, OnInit} from '@angular/core';
import {NgIf, NgFor} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";

@Component({
  selector: 'app-project-annex-dialog',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, ButtonComponent],
  templateUrl: './project-annex-dialog.component.html',
  styleUrl: './project-annex-dialog.component.css',
  host: { 'class': 'transparent-dialog-host' }
})
export class ProjectAnnexDialogComponent implements OnInit {

  annexForm: FormGroup;
  annexFile: File = null;

  feeTypes: any[];
  salaryTypes: any[];
  currencyList: any[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private rest: RestService,
    private dialogRef: MatDialogRef<ProjectAnnexDialogComponent>,
    private dialogService: DialogService
  ) {
    this.loadStatics();
  }

  ngOnInit(): void {
    const p = this.data.project;
    this.annexForm = new FormGroup({
      reason: new FormControl(null, [Validators.required]),
      effectiveDate: new FormControl(null, [Validators.required]),
      isExpired: new FormControl(p.isExpired),
      startDate: new FormControl(p.startDate ? this.toDateInput(p.startDate) : null, [Validators.required]),
      endDate: new FormControl(p.endDate ? this.toDateInput(p.endDate) : null),
      salaryFeeTypeID: new FormControl(p.salaryFeeTypeID),
      fee_type_salary_value: new FormControl(p.fee_type_salary_value, [Validators.min(0)]),
      fee_type_cost_value: new FormControl(p.fee_type_cost_value),
      salary_typeID: new FormControl(p.salary_typeID),
      payment_due_on_salary: new FormControl(p.payment_due_on_salary),
      payment_due_on_cost: new FormControl(p.payment_due_on_cost),
      costFeeTypeID: new FormControl(p.costFeeTypeID),
      salaryCurrencyID: new FormControl(p.salaryCurrencyID),
      costCurrencyID: new FormControl(p.costCurrencyID),
      fileName: new FormControl(null),
    });

    // PY flow: lock fee type to Fixed (ID 3)
    if (!this.data.showCostFee) {
      this.annexForm.get('salaryFeeTypeID').setValue(3);
      this.annexForm.get('salaryFeeTypeID').disable();
    }

    this.annexForm.get('isExpired').valueChanges.subscribe(val => {
      if (!val) {
        this.annexForm.get('endDate').setValue(null);
      }
    });
  }

  toDateInput(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  onFileSelected(event: Event) {
    this.annexFile = (event.target as HTMLInputElement).files[0];
  }

  loadStatics() {
    this.rest.getFeeTypes().subscribe(res => {
      if (res.status === 200) this.feeTypes = res.data;
    });
    this.rest.getSalaryTypes().subscribe(res => {
      if (res.status === 200) this.salaryTypes = res.data;
    });
    this.rest.getCurrencyList().subscribe(res => {
      if (res.status === 200) this.currencyList = res.data;
    });
  }

  save() {
    if (!this.annexForm.get('reason').valid || !this.annexForm.get('effectiveDate').valid) {
      this.dialogService.showMsgDialog('Please fill in the reason and effective date.');
      return;
    }

    const f = this.annexForm.getRawValue();
    const formData = new FormData();

    if (this.annexFile) {
      formData.append('file', this.annexFile);
    }

    formData.set('projectID', this.data.project.ID.toString());
    formData.set('dealID', this.data.dealID.toString());
    formData.set('reason', f.reason);
    formData.set('effectiveDate', f.effectiveDate);
    formData.set('isExpired', f.isExpired);
    formData.set('startDate', f.startDate);
    formData.set('endDate', f.endDate || 'null');
    formData.set('salaryFeeTypeID', f.salaryFeeTypeID?.toString() || 'null');
    formData.set('fee_type_salary_value', f.fee_type_salary_value?.toString() || 'null');
    formData.set('fee_type_cost_value', f.fee_type_cost_value?.toString() || 'null');
    formData.set('salary_typeID', f.salary_typeID?.toString() || 'null');
    formData.set('payment_due_on_salary', f.payment_due_on_salary?.toString() || 'null');
    formData.set('payment_due_on_cost', f.payment_due_on_cost?.toString() || 'null');
    formData.set('costFeeTypeID', f.costFeeTypeID?.toString() || 'null');
    formData.set('salaryCurrencyID', f.salaryCurrencyID?.toString() || 'null');
    formData.set('costCurrencyID', f.costCurrencyID?.toString() || 'null');
    formData.set('filePath', this.data.clientName || '');
    formData.set('clientID', this.data.clientID?.toString() || 'null');
    formData.set('fileName', f.fileName || 'annex');

    this.dialogService.showLoader();
    this.rest.createProjectAnnex(formData).subscribe({
      next: (res) => {
        this.dialogService.closeLoader();
        if (res.status === 200) {
          this.dialogService.showSnackBar('Contract annex created successfully!', '', 3000);
          this.dialogRef.close(res.data);
        }
      },
      error: (err) => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + (err.error?.message || 'Server error'));
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
