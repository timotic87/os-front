import {Component, Inject, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {PickFileComponent} from "../../../../clients/documentaton/elements/pick-file/pick-file.component";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RestService} from "../../../../services/rest.service";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {DialogService} from "../../../../services/dialog.service";

@Component({
  selector: 'app-edit-deal-dialog',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './edit-deal-dialog.component.html',
  styleUrl: './edit-deal-dialog.component.css'
})
export class EditDealDialogComponent implements OnInit{

  createDealForm: FormGroup;

  feeTypes;
  salaryTypes;
  currencyList;

  constructor(private rest: RestService,  @Inject(MAT_DIALOG_DATA) public data: any, private dialogService: DialogService) {
    console.log(data)
    this.getStatics();
  }

  ngOnInit(): void {
    this.createDealForm = new FormGroup({
      deal_number: new FormControl(this.data.deal_number, [Validators.required]),
      salaryFeetype: new FormControl(null, [Validators.required]),
      costFeetype: new FormControl(null, [Validators.required]),
      isExpired: new FormControl(this.data.isExpired),
      startDate: new FormControl(this.formatDate(this.data.startDate), [Validators.required]),
      endDate: new FormControl(this.data.isExpired ? this.formatDate(this.data.endDate):null),
      salaryValue: new FormControl(this.data.fee_type_salary_value, [Validators.required]),
      salaryType: new FormControl(null, [Validators.required]),
      costValue: new FormControl(this.data.fee_type_cost_value, [Validators.required]),
      costType: new FormControl({value: 'COST', disabled:true}, [Validators.required]),
      salarydaysdue: new FormControl(this.data.payment_due_on_salary, [Validators.required]),
      costdaysdue: new FormControl(this.data.payment_due_on_cost, [Validators.required]),
      salaryCurrency: new FormControl(null, [Validators.required]),
      costCurrency: new FormControl(null, [Validators.required])
    })
  }

  getStatics(){
    this.rest.getFeeTypes().subscribe(res=>{
      if (res.status===200){
        this.feeTypes = res.data;

        this.createDealForm.get('salaryFeetype').setValue(this.getObjByID(this.data.salaryFeeTypeID, this.feeTypes));
        this.createDealForm.get('costFeetype').setValue(this.getObjByID(this.data.costFeeTypeID, this.feeTypes));
      }
    });
    this.rest.getSalaryTypes().subscribe(res=>{
      if (res.status===200){
        this.salaryTypes = res.data;
        this.createDealForm.get('salaryType').setValue(this.getObjByID(this.data.salary_typeID, this.salaryTypes));
      }
    });
    this.rest.getCurrencyList().subscribe(res=>{
      if (res.status===200){
        this.currencyList = res.data;
        this.createDealForm.get('salaryCurrency').setValue(this.getObjByID(this.data.salaryCurrencyID, this.currencyList));
        this.createDealForm.get('costCurrency').setValue(this.getObjByID(this.data.costCurrencyID, this.currencyList));
      }
    })
  }

  createDeal(){
    console.log(this.data)
    let formParams = new FormData();

    formParams.set('deal_number', this.createDealForm.value.deal_number);
    formParams.set('isExpired', this.createDealForm.value.isExpired);
    formParams.set('startDate', this.createDealForm.value.startDate);
    formParams.set('endDate', this.createDealForm.value.endDate);
    formParams.set('projectID', this.data.project.ID);
    formParams.set('clientID', this.data.client.id);
    formParams.set('salaryFeeTypeID', this.createDealForm.value.salaryFeetype.ID);
    formParams.set('fee_type_salary_value', this.createDealForm.value.salaryValue);
    formParams.set('fee_type_cost_value', this.createDealForm.value.costValue);
    formParams.set("salary_typeID", this.createDealForm.value.salaryType.ID);
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
  }

  getObjByID(id, list){
    return list.find(item => item.ID === id || item.id === id);
  }

}
