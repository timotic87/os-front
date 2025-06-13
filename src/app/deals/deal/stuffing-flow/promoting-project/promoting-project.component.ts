import {Component, Input, OnInit} from '@angular/core';
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
          endDate: new FormControl(null,[Validators.required]),
          salaryValue: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(100)]),
          salaryType: new FormControl(null, [Validators.required]),
          costValue: new FormControl(null, [Validators.required, Validators.min(1), Validators.max(100)]),
          costType: new FormControl({value: 'COST', disabled:true}, [Validators.required]),
          salarydaysdue: new FormControl(null, [Validators.required, Validators.min(1)]),
          costdaysdue: new FormControl(null, [Validators.required, Validators.min(1)]),
          salaryCurrency: new FormControl(null, [Validators.required]),
          costCurrency: new FormControl(null, [Validators.required])
        });

        this.createDealForm.get('salaryFeetype').valueChanges.subscribe(value => {
          if (value.ID===3) {
            this.createDealForm.get('salaryType').setValue(null);
            this.createDealForm.get('salaryValue').setValue(null);
            this.createDealForm.get('salaryType').clearValidators();
            this.createDealForm.get('salaryValue').clearValidators();
            this.createDealForm.get('salaryValue').addValidators([Validators.required, Validators.min(1)]);
          }else if(value.ID===1) {
            this.createDealForm.get('salaryType').setValue(null);
            this.createDealForm.get('salaryValue').setValue(null);
            this.createDealForm.get('salaryType').clearValidators();
            this.createDealForm.get('salaryValue').clearValidators();
            this.createDealForm.get('salaryType').addValidators(Validators.required);
            this.createDealForm.get('salaryValue').addValidators([Validators.required, Validators.min(1), Validators.max(100)]);
          }else if(value.ID===2){
            this.createDealForm.get('salaryType').setValue(null);
            this.createDealForm.get('salaryValue').setValue(null);
            this.createDealForm.get('salaryType').clearValidators();
            this.createDealForm.get('salaryValue').clearValidators();
            this.createDealForm.get('salaryType').addValidators(Validators.required);
            this.createDealForm.get('salaryValue').addValidators([Validators.required, Validators.min(1)]);
          }

        });

    this.createDealForm.get('costFeetype').valueChanges.subscribe(value => {
      if (value.ID===3) {
        this.createDealForm.get('costValue').setValue(null);
        this.createDealForm.get('costValue').clearValidators();
        this.createDealForm.get('costValue').addValidators([Validators.required, Validators.min(1)]);
      }else if(value.ID===1) {
        this.createDealForm.get('costValue').setValue(null);
        this.createDealForm.get('costValue').clearValidators();
        this.createDealForm.get('costValue').addValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      }else if(value.ID===2){
        this.createDealForm.get('costValue').setValue(null);
        this.createDealForm.get('costValue').clearValidators();
        this.createDealForm.get('costValue').addValidators([Validators.required, Validators.min(1)]);
      }

    });

        this.createDealForm.get('isExpired').valueChanges.subscribe(value => {
          if (value) {
            this.createDealForm.get('endDate').setValue(null);
            this.createDealForm.get('endDate').clearValidators();
            this.createDealForm.get('endDate').addValidators(Validators.required);
          }else {
            this.createDealForm.get('endDate').setValue(null);
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
      }
    })
  }

  async promoteProjectClick(){
    if (!this.userService.can('edit_deal') && !await this.userService.hasEntityAccess('deal', this.deal.ID, 'edit')){
      this.dialogService.showMsgDialog("You don't have the right to change deals.");
      return
    }

    if (!this.createDealForm.valid) {
      this.dialogService.showMsgDialog("Please fill in all required fields");
      return;
    }

    let formParams = new FormData();
    formParams.append('file', this.contractFile as File);
    formParams.set('dealID', this.deal.ID);
    formParams.set('filePath', this.deal.client.name);
    formParams.set('fileName', this.createDealForm.get('contract_file_name').value);
    formParams.set('typeName', 'Contract');
    formParams.set('subTypeName', 'Staffing and payroll');
    formParams.set('isExpired', this.createDealForm.value.isExpired);
    formParams.set('startDate', this.createDealForm.value.startDate);
    formParams.set('endDate', this.createDealForm.value.endDate);
    formParams.set('clientID', this.deal.client.id);
    formParams.set('salaryFeeTypeID', this.createDealForm.value.salaryFeetype? this.createDealForm.value.salaryFeetype.ID:null);
    formParams.set('fee_type_salary_value', this.createDealForm.value.salaryValue);
    formParams.set('fee_type_cost_value', this.createDealForm.value.costValue);
    formParams.set('salary_typeID', this.createDealForm.value.salaryType? this.createDealForm.value.salaryType.ID:null);
    formParams.set('payment_due_on_salary', this.createDealForm.value.salarydaysdue);
    formParams.set('payment_due_on_cost', this.createDealForm.value.costdaysdue);
    formParams.set('costFeeTypeID', this.createDealForm.value.costFeetype? this.createDealForm.value.costFeetype.ID:null);
    formParams.set('salaryCurrency', this.createDealForm.value.salaryCurrency ? this.createDealForm.value.salaryCurrency.id:null);
    formParams.set('costCurrency', this.createDealForm.value.costCurrency ? this.createDealForm.value.costCurrency.id:null);


    this.dialogService.showLoader();
    this.rest.promotingToProject(formParams).subscribe({
      next: res =>{
        if (res.status===200){
          this.dialogService.closeLoader();
          window.location.reload();
          window.scrollTo(0, document.body.scrollHeight);
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    })

  }

}
