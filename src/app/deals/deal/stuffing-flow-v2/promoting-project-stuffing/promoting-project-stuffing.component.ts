import {Component, Inject, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {PickFileComponent} from "../../../../clients/documentaton/elements/pick-file/pick-file.component";
import {RestService} from "../../../../services/rest.service";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {DialogService} from "../../../../services/dialog.service";
import {UserService} from "../../../../services/user.service";

@Component({
  selector: 'app-promoting-project-stuffing',
  standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgIf,
        NgClass,
        PickFileComponent
    ],
  templateUrl: './promoting-project-stuffing.component.html',
  styleUrl: './promoting-project-stuffing.component.css'
})
export class PromotingProjectStuffingComponent implements OnInit{

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
          contract_file_name: new FormControl(null, [Validators.required]),
          salaryFeetype: new FormControl({value: '', disabled: true}, [Validators.required]),
          isExpired: new FormControl(true ),
          startDate: new FormControl(null, [Validators.required]),
          endDate: new FormControl(null,[Validators.required]),
          salaryValue: new FormControl(null, [Validators.required, Validators.min(1)]),
          salaryType: new FormControl({value: null, disabled: true}),
          salarydaysdue: new FormControl(null, [Validators.required]),
          salaryCurrency: new FormControl(null, [Validators.required])
        });

        this.createDealForm.get('isExpired').valueChanges.subscribe(value => {
          if (value) {
            this.createDealForm.get('endDate').setValue(null);
            this.createDealForm.get('endDate').enable();
            this.createDealForm.get('endDate').clearValidators();
            this.createDealForm.get('endDate').addValidators(Validators.required);
          }else {
            this.createDealForm.get('endDate').setValue(null);
            this.createDealForm.get('endDate').disable();
            this.createDealForm.get('endDate').clearValidators();
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
        this.createDealForm.get('salaryFeetype').setValue(this.feeTypes[2]);
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
      if (!c['salaryValue'].valid) missing.push('Fee value');
      if (!c['salarydaysdue'].valid) missing.push('Payment due days');
      if (!c['salaryCurrency'].valid) missing.push('Currency');
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
    formParams.set('subTypeName', 'Stuffing');
    formParams.set('isExpired', f.isExpired);
    formParams.set('startDate', f.startDate);
    formParams.set('endDate', f.endDate);
    formParams.set('clientID', this.deal.client.id);
    formParams.set('salaryFeeTypeID', f.salaryFeetype?.ID ?? null);
    formParams.set('fee_type_salary_value', f.salaryValue);
    formParams.set('fee_type_cost_value', null);
    formParams.set('salary_typeID', f.salaryType?.ID ?? null);
    formParams.set('payment_due_on_salary', f.salarydaysdue);
    formParams.set('payment_due_on_cost', null);
    formParams.set('costFeeTypeID', null);
    formParams.set('salaryCurrency', f.salaryCurrency?.ID ?? null);
    formParams.set('costCurrency', null);

    this.dialogService.showLoader();
    this.rest.promotingToProject(formParams).subscribe({
      next: res=>{
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
