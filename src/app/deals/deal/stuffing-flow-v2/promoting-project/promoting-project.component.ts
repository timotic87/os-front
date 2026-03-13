import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {PickFileComponent} from "../../../../clients/documentaton/elements/pick-file/pick-file.component";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";
import {UserService} from "../../../../services/user.service";

@Component({
  selector: 'app-promoting-project',
  standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgIf,
        NgClass,
        PickFileComponent
    ],
  templateUrl: './promoting-project.component.html',
  styleUrl: './promoting-project.component.css'
})
export class PromotingProjectComponent implements OnInit{

  createDealForm: FormGroup;
  contractFile: File = null;

  feeTypes;
  salaryTypes;
  currencyList;

  @Input() deal: any
  @Output() projectPromoted = new EventEmitter<any>();

  constructor(private rest: RestService, private dialogService: DialogService, private userService: UserService) {
    this.getStatics();
  }

  ngOnInit(): void {
        this.createDealForm = new FormGroup({
          contract_file_name: new FormControl(null, [Validators.required, Validators.minLength(3)]),
          salaryFeetype: new FormControl(null, [Validators.required]),
          costFeetype: new FormControl(null, [Validators.required]),
          isExpired: new FormControl(true ),
          startDate: new FormControl(null, [Validators.required]),
          endDate: new FormControl('',[Validators.required]),
          salaryValue: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(100)]),
          salaryType: new FormControl('', [Validators.required]),
          costValue: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(100)]),
          costType: new FormControl({value: 'COST', disabled:true}),
          salarydaysdue: new FormControl(null, [Validators.required, Validators.min(1)]),
          costdaysdue: new FormControl(null, [Validators.required, Validators.min(1)]),
          salaryCurrency: new FormControl(null),
          costCurrency: new FormControl(null)
        });

        this.createDealForm.get('salaryFeetype').valueChanges.subscribe(value => {
          const salaryValue = this.createDealForm.get('salaryValue');
          const salaryType = this.createDealForm.get('salaryType');
          const salaryCurrency = this.createDealForm.get('salaryCurrency');

          salaryValue.setValue(null);
          salaryValue.clearValidators();
          salaryType.clearValidators();
          salaryCurrency.clearValidators();

          if (value.ID === 3) {
            // Fixed fee: need amount + currency, no salary type
            salaryType.setValue(null);
            salaryType.disable();
            salaryValue.addValidators([Validators.required, Validators.min(1)]);
            salaryCurrency.addValidators(Validators.required);
          } else if (value.ID === 1) {
            // Percentage: need %, salary type, no currency
            salaryType.setValue(null);
            salaryType.enable();
            salaryType.addValidators(Validators.required);
            salaryValue.addValidators([Validators.required, Validators.min(1), Validators.max(100)]);
          } else if (value.ID === 2) {
            // Multiplier: need multiplier, salary type, no currency
            salaryType.setValue(null);
            salaryType.enable();
            salaryType.addValidators(Validators.required);
            salaryValue.addValidators([Validators.required, Validators.min(0.1)]);
          }

          salaryValue.updateValueAndValidity();
          salaryType.updateValueAndValidity();
          salaryCurrency.updateValueAndValidity();
        });

    this.createDealForm.get('costFeetype').valueChanges.subscribe(value => {
      const costValue = this.createDealForm.get('costValue');
      const costCurrency = this.createDealForm.get('costCurrency');

      costValue.setValue(null);
      costValue.clearValidators();
      costCurrency.clearValidators();

      if (value.ID === 3) {
        // Fixed fee: need amount + currency
        costValue.addValidators([Validators.required, Validators.min(1)]);
        costCurrency.addValidators(Validators.required);
      } else if (value.ID === 1) {
        // Percentage: need %
        costValue.addValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      } else if (value.ID === 2) {
        // Multiplier: need multiplier
        costValue.addValidators([Validators.required, Validators.min(0.1)]);
      }

      costValue.updateValueAndValidity();
      costCurrency.updateValueAndValidity();
    });

        this.createDealForm.get('isExpired').valueChanges.subscribe(value => {
          if (value) {
            this.createDealForm.get('endDate').setValue("");
            this.createDealForm.get('endDate').enable();
            this.createDealForm.get('endDate').clearValidators();
            this.createDealForm.get('endDate').addValidators(Validators.required);
          }else {
            this.createDealForm.get('endDate').setValue("");
            this.createDealForm.get('endDate').clearValidators();
            this.createDealForm.get('endDate').disable();
          }
        })
    }

  contractSelectDoc(event: Event){
    // @ts-ignore
    this.contractFile = event.target.files[0];
  }

  getStatics(){
    this.rest.getFeeTypes().subscribe(res=>{
      if (res.status===200){
        this.feeTypes = res.data;
        this.createDealForm.get('salaryFeetype').setValue(this.feeTypes[0]);
        this.createDealForm.get('costFeetype').setValue(this.feeTypes[0]);
      }
    });
    this.rest.getSalaryTypes().subscribe(res=>{
      if (res.status===200){
        this.salaryTypes = res.data;
      }
    });
    this.rest.getCurrencyList().subscribe(res=>{
      if (res.status===200){
        this.currencyList = res.data;
        // Set RSD as default currency
        const rsd = this.currencyList.find(c => c.code === 'RSD');
        if (rsd) {
          this.createDealForm.get('salaryCurrency').setValue(rsd);
          this.createDealForm.get('costCurrency').setValue(rsd);
        }
      }
    })
  }

  async promoteProjectClick(){
    if (!this.userService.can('edit_deal') && !await this.userService.hasEntityAccess('deal', this.deal.ID, 'edit')){
      this.dialogService.showMsgDialog("You don't have the right to change deals.");
      return
    }

    this.createDealForm.markAllAsTouched();

    if (!this.createDealForm.valid) {
      const missing = [];
      const c = this.createDealForm.controls;
      if (!c['contract_file_name'].valid) missing.push('Contract file name');
      if (!c['startDate'].valid) missing.push('Start date');
      if (c['endDate'].enabled && !c['endDate'].valid) missing.push('End date');
      if (!c['salaryFeetype'].valid) missing.push('Salary fee type');
      if (!c['salaryValue'].valid) missing.push('Salary fee value');
      if (c['salaryType'].enabled && !c['salaryType'].valid) missing.push('Salary type');
      if (!c['salarydaysdue'].valid) missing.push('Salary days due');
      if (c['salaryCurrency'].enabled && !c['salaryCurrency'].valid) missing.push('Salary currency');
      if (!c['costFeetype'].valid) missing.push('Cost fee type');
      if (!c['costValue'].valid) missing.push('Cost fee value');
      if (!c['costdaysdue'].valid) missing.push('Cost days due');
      if (c['costCurrency'].enabled && !c['costCurrency'].valid) missing.push('Cost currency');
      this.dialogService.showMsgDialog('Please fill in: ' + (missing.length ? missing.join(', ') : 'all required fields'));
      return;
    }

    const f = this.createDealForm.getRawValue();
    let formParams = new FormData();
    formParams.append('file', this.contractFile as File);
    formParams.set('dealID', this.deal.ID);
    formParams.set('filePath', this.deal.client.customerName);
    formParams.set('fileName', f.contract_file_name);
    formParams.set('typeName', 'Contract');
    formParams.set('subTypeName', 'Staffing and payroll');
    formParams.set('isExpired', f.isExpired);
    formParams.set('startDate', f.startDate);
    formParams.set('endDate', f.endDate);
    formParams.set('clientID', this.deal.client.id);
    formParams.set('salaryFeeTypeID', f.salaryFeetype?.ID ?? null);
    formParams.set('fee_type_salary_value', f.salaryValue);
    formParams.set('fee_type_cost_value', f.costValue);
    formParams.set('salary_typeID', f.salaryType?.ID ?? null);
    formParams.set('payment_due_on_salary', f.salarydaysdue);
    formParams.set('payment_due_on_cost', f.costdaysdue);
    formParams.set('costFeeTypeID', f.costFeetype?.ID ?? null);
    formParams.set('salaryCurrency', f.salaryCurrency?.ID ?? null);
    formParams.set('costCurrency', f.costCurrency?.ID ?? null);

    this.dialogService.showLoader();
    this.rest.promotingToProject(formParams).subscribe({
      next: res =>{
        if (res.status===200){
          this.dialogService.closeLoader();
          this.dialogService.showSnackBar('Project promoted successfully!', '', 3000);
          // Emit event to parent component with updated status
          this.projectPromoted.emit({
            success: true,
            newFlowStatusID: 15,
            message: 'Project has been successfully promoted'
          });
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    })

  }

}
