import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {PickFileComponent} from "../../../../clients/documentaton/elements/pick-file/pick-file.component";
import {RestService} from "../../../../services/rest.service";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {DialogService} from "../../../../services/dialog.service";

@Component({
  selector: 'app-create-deal-dialog',
  standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgIf,
        NgClass,
        PickFileComponent
    ],
  templateUrl: './create-deal-dialog.component.html',
  styleUrl: './create-deal-dialog.component.css'
})
export class CreateDealDialogComponent implements OnInit{

  createDealForm: FormGroup;
  contractFile: File = null;

  feeTypes;
  salaryTypes;
  currencyList;

  constructor(private rest: RestService,  @Inject(MAT_DIALOG_DATA) public data: any, private dialogService: DialogService) {
    this.getStatics();
  }

  ngOnInit(): void {
        this.createDealForm = new FormGroup({
          deal_number: new FormControl(null, [Validators.required]),
          contract_file_name: new FormControl(null, [Validators.required]),
          salaryFeetype: new FormControl(null, [Validators.required]),
          costFeetype: new FormControl(null, [Validators.required]),
          isExpired: new FormControl(false),
          startDate: new FormControl(null, [Validators.required]),
          endDate: new FormControl(null),
          salaryValue: new FormControl(null, [Validators.required]),
          salaryType: new FormControl(null, [Validators.required]),
          costValue: new FormControl(null, [Validators.required]),
          costType: new FormControl({value: 'COST', disabled:true}, [Validators.required]),
          salarydaysdue: new FormControl(null, [Validators.required]),
          costdaysdue: new FormControl(null, [Validators.required]),
          salaryCurrency: new FormControl(null, [Validators.required]),
          costCurrency: new FormControl(null, [Validators.required])
        })
    }

  // offerSelectDoc(event: Event){
  //   // @ts-ignore
  //   this.offerFIle = event.target.files[0];
  // }

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

  createDeal(){
    console.log(this.data)
    let formParams = new FormData();
    formParams.append('file', this.contractFile as File);
    formParams.set('filePath', this.data.client.name);
    formParams.set('fileName', this.createDealForm.get('contract_file_name').value);
    formParams.set('typeName', 'Contract');
    formParams.set('subTypeName', 'Staffing and payroll');

    formParams.set('deal_number', this.createDealForm.value.deal_number);
    formParams.set('isExpired', this.createDealForm.value.isExpired);
    formParams.set('startDate', this.createDealForm.value.startDate);
    formParams.set('endDate', this.createDealForm.value.endDate);
    formParams.set('projectID', this.data.project.ID);
    formParams.set('clientID', this.data.client.id);
    formParams.set('salaryFeeTypeID', this.createDealForm.value.salaryFeetype.ID);
    formParams.set('fee_type_salary_value', this.createDealForm.value.salaryValue);
    formParams.set('fee_type_cost_value', this.createDealForm.value.costValue);
    formParams.set('salary_typeID', this.createDealForm.value.salaryType.ID);
    formParams.set('payment_due_on_salary', this.createDealForm.value.salarydaysdue);
    formParams.set('payment_due_on_cost', this.createDealForm.value.costdaysdue);
    formParams.set('costFeeTypeID', this.createDealForm.value.costFeetype.ID);
    formParams.set('salaryCurrency', this.createDealForm.value.salaryCurrency ? this.createDealForm.value.salaryCurrency.id:null);
    formParams.set('costCurrency', this.createDealForm.value.costCurrency ? this.createDealForm.value.costCurrency.id:null);

    // this.rest.createDeal(formParams).subscribe(res => {
    //   console.log(res)
    //   if (res.status === 201) {
    //     this.dialogService.showSnackBar('Successfully saved document', '',5000);
    //     return;
    //   }
    //   this.dialogService.showSnackBar(res.data.name+' '+res.data.num, '', 5000)
    // })

  }

}
