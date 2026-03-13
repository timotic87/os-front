import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RestService} from '../../../../services/rest.service';
import {DialogService} from '../../../../services/dialog.service';
import {UserService} from '../../../../services/user.service';
import {PickFileComponent} from '../../../../clients/documentaton/elements/pick-file/pick-file.component';
import {ButtonComponent} from '../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-custom-flow-promote-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PickFileComponent, ButtonComponent],
  templateUrl: './custom-flow-promote-step.component.html',
  styleUrl: './custom-flow-promote-step.component.css'
})
export class CustomFlowPromoteStepComponent implements OnInit {

  @Input() deal: any;
  @Output() projectPromoted = new EventEmitter<any>();

  form: FormGroup;
  contractFile: File = null;

  constructor(
    private rest: RestService,
    private dialogService: DialogService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      contract_file_name: new FormControl(null, [Validators.required]),
      isExpired: new FormControl(true),
      startDate: new FormControl(null, [Validators.required]),
      endDate: new FormControl(null, [Validators.required])
    });

    this.form.get('isExpired').valueChanges.subscribe(value => {
      const endDate = this.form.get('endDate');
      endDate.setValue(null);
      if (value) {
        endDate.enable();
        endDate.setValidators(Validators.required);
      } else {
        endDate.disable();
        endDate.clearValidators();
      }
      endDate.updateValueAndValidity();
    });
  }

  onContractFileSelected(event: Event): void {
    this.contractFile = (event.target as HTMLInputElement).files?.[0] || null;
  }

  async promote(): Promise<void> {
    if (!this.userService.can('edit_deal') && !await this.userService.hasEntityAccess('deal', this.deal.ID, 'edit')) {
      this.dialogService.showMsgDialog("You don't have the right to change deals.");
      return;
    }

    this.form.markAllAsTouched();

    if (!this.form.valid) {
      const missing = [];
      const c = this.form.controls;
      if (!c['contract_file_name'].valid) missing.push('Contract file name');
      if (!c['startDate'].valid) missing.push('Start date');
      if (c['endDate'].enabled && !c['endDate'].valid) missing.push('End date');
      this.dialogService.showMsgDialog('Please fill in: ' + missing.join(', '));
      return;
    }

    if (!this.contractFile) {
      this.dialogService.showMsgDialog('Please select a contract file.');
      return;
    }

    const f = this.form.getRawValue();
    const formParams = new FormData();
    formParams.append('file', this.contractFile);
    formParams.set('dealID', this.deal.ID);
    formParams.set('filePath', this.deal.client.customerName);
    formParams.set('fileName', f.contract_file_name);
    formParams.set('typeName', 'Contract');
    formParams.set('subTypeName', 'Custom');
    formParams.set('isExpired', f.isExpired);
    formParams.set('startDate', f.startDate);
    formParams.set('endDate', f.endDate);
    formParams.set('clientID', this.deal.client.id);
    // No fee fields - send nulls
    formParams.set('salaryFeeTypeID', 'null');
    formParams.set('fee_type_salary_value', 'null');
    formParams.set('fee_type_cost_value', 'null');
    formParams.set('salary_typeID', 'null');
    formParams.set('payment_due_on_salary', 'null');
    formParams.set('payment_due_on_cost', 'null');
    formParams.set('costFeeTypeID', 'null');
    formParams.set('salaryCurrency', 'null');
    formParams.set('costCurrency', 'null');

    this.dialogService.showLoader();
    this.rest.promotingToProject(formParams).subscribe({
      next: res => {
        this.dialogService.closeLoader();
        if (res.status === 200) {
          this.dialogService.showSnackBar('Project promoted successfully!', '', 3000);
          this.projectPromoted.emit({
            success: true,
            startDate: f.startDate,
            endDate: f.endDate,
            isExpired: f.isExpired,
            fileName: f.contract_file_name
          });
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
      }
    });
  }
}
