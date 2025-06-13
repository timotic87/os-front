import {Component, Inject, OnInit} from '@angular/core';
import {CurrencyPipe, NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CDCMService} from "../../services/cdcm.service";
import {DialogService} from "../../services/dialog.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserService} from "../../services/user.service";
import {RestService} from "../../services/rest.service";
import {ApprovalCardComponent} from "../../customComponents/approval-card/approval-card.component";

@Component({
  selector: 'app-cdcm-view-edit',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgIf,
    ReactiveFormsModule,
    NgClass,
    ApprovalCardComponent
  ],
  templateUrl: './cdcm-view-edit.component.html',
  styleUrl: './cdcm-view-edit.component.css'
})
export class CdcmViewEditComponent implements OnInit {

  ChargingDPArr= [{name: 'NO', num: 0},{name: 'YES', num: 1}];
  PayslipsArr= [{name: 'NO', num: 0},{name: 'YES', num: 1}];
  feeTypes= [{name: 'Markup', num: 0},{name: 'Flat', num: 1}];

  basicInfoForm: FormGroup;
  operationalCostForm: FormGroup;

  showBasicInfoMsgValidation = false;
  showOperationalCostMsgValidation = false;

  collective_insurance = 0
  payslipsCost = 0;

  cdcm: any;
  cdcmApproval: any;


  constructor(public cdcmService: CDCMService, private dialogService: DialogService, @Inject(MAT_DIALOG_DATA) public data: any,
              private dialogRef: MatDialogRef<CdcmViewEditComponent>, private userService: UserService, private rest: RestService) {
    cdcmService.getFields();
        this.cdcm = this.data.cdcm
    cdcmService.seniorityListListener.subscribe(()=>{

      if (this.cdcm.isHra){
        this.operationalCostForm.get('HRA_Consultant').setValue(cdcmService.getSeniorityObjByName(this.cdcm.hra_conultant_seniority));
      }
      if (this.cdcm.isPy){
        this.operationalCostForm.get('PY_Consultant').setValue(cdcmService.getSeniorityObjByName(this.cdcm.py_conultant_seniority));
        this.payslipsCost=this.cdcm.payslips_cost;
      }
    });

  cdcmService.updateCDCMSubject.subscribe(cdcmUpdated => {
    if (cdcmUpdated) {
      this.dialogRef.close();
    }
  })

    cdcmService.calculationCDCM = {
      "directCost": this.cdcm.direct_cost,
      "fee": this.cdcm.fee,
      "revenue": this.cdcm.revenue,
      "financingCost": this.cdcm.financing_cost,
      "franshiseFeeCost": this.cdcm.franshise_fee,
      "operationalCost": this.cdcm.operational_cost,
      "gp": {
        "grossProfit": this.cdcm.gross_profit,
        "gpPercent": this.cdcm.gross_profit_percent
      },
      "np": {
        "netProfit": this.cdcm.net_profit,
        "npPercent": this.cdcm.net_profit_percent
      }
    };
  }

  ngOnInit(): void {
    this.getApprovalsByCdcmID(this.cdcm.ID);
     this.basicInfoForm = new FormGroup({
      No_of_employees: new FormControl(this.cdcm.No_of_employees, [Validators.required]),
      Grand_Groos_Salaray_per_Employee: new FormControl(this.cdcm.Grand_Groos_Salaray_per_Employee, [Validators.required]),
      other_cost: new FormControl(this.cdcm.other_cost, [Validators.required]),
      disabled_people: new FormControl({value: this.cdcm.disabled_people, disabled: true}),
      Charging_DP: new FormControl({ disabled: true}),
      feeTypes: new FormControl(this.cdcm.MU_on_costs? this.feeTypes[0]:this.feeTypes[1]),
      MU_on_salary: new FormControl(this.cdcm.MU_on_salary, [Validators.required]),
      MU_on_costs: new FormControl(this.cdcm.MU_on_costs, [Validators.required]),
      MU_on_disabled_people: new FormControl(this.cdcm.MU_on_disabled_people),
      Flat_fee: new FormControl({value:this.cdcm.Flat_fee, disabled: true}),
      due_days_on_cost: new FormControl(this.cdcm.due_days_on_cost, [Validators.required]),
      due_days_on_fee: new FormControl(this.cdcm.due_days_on_fee, [Validators.required])
    });
    this.basicInfoForm.get('Charging_DP').setValue(this.cdcm.Charging_DP? this.ChargingDPArr[1]:this.ChargingDPArr[0])
    this.basicInfoForm.get('No_of_employees').valueChanges.subscribe(value=>{
      this.collective_insurance = value*this.cdcmService.cdcmStaticsList[0].valueDouble;
      this.payslipsCost = value*this.cdcmService.cdcmStaticsList[1].valueDouble;

      if(value>19){
        this.basicInfoForm.get('disabled_people').setValue(this.cdcmService.getDisabledPeople(value));
        this.basicInfoForm.get('Charging_DP').enable();
      }else {
        this.basicInfoForm.get('disabled_people').setValue(0);
        this.basicInfoForm.get('Charging_DP').setValue(this.ChargingDPArr[0]);
        this.basicInfoForm.get('Charging_DP').disable();
      }
    });
    this.basicInfoForm.get('feeTypes').valueChanges.subscribe(value=>{
      if(value.num===0){
        this.basicInfoForm.get('Flat_fee').disable();
        this.basicInfoForm.get('Flat_fee').clearValidators();
        this.basicInfoForm.get('MU_on_salary').enable();
        this.basicInfoForm.get('MU_on_costs').enable();
        this.basicInfoForm.get('MU_on_salary').setValidators([Validators.required]);
        this.basicInfoForm.get('MU_on_costs').setValidators([Validators.required]);
      }else {
        this.basicInfoForm.get('Flat_fee').enable();
        this.basicInfoForm.get('Flat_fee').setValidators([Validators.required]);
        this.basicInfoForm.get('MU_on_salary').disable();
        this.basicInfoForm.get('MU_on_costs').disable();
        this.basicInfoForm.get('MU_on_salary').clearValidators();
        this.basicInfoForm.get('MU_on_costs').clearValidators();
      }
    })
    this.basicInfoForm.get('Charging_DP').valueChanges.subscribe(value=>{
      if(value.num===0){
        this.basicInfoForm.get('MU_on_disabled_people').disable();
        this.basicInfoForm.get('MU_on_disabled_people').clearValidators();
      }else {
        this.basicInfoForm.get('MU_on_disabled_people').enable();
        this.basicInfoForm.get('MU_on_disabled_people').setValidators([Validators.required]);
      }
    })
    this.basicInfoForm.valueChanges.subscribe(()=>{
      if(this.basicInfoForm.valid) this.showBasicInfoMsgValidation=false;
    })


    this.operationalCostForm = new FormGroup({
      hra_checkbox: new FormControl(this.cdcm.isHra),
      payroll_checkbox: new FormControl(this.cdcm.isPy),
      HRA_Consultant: new FormControl(null, Validators.required),
      HRA_percent_of_time: new FormControl(this.cdcm.hra_consultant_percent, Validators.required),
      PY_Consultant: new FormControl(null, Validators.required),
      PY_percent_of_time: new FormControl(this.cdcm.py_consultant_percent, Validators.required),
      additional_costs: new FormControl(this.cdcm.additional_costs, Validators.required),
      payslips: new FormControl(this.cdcm.payslips_cost>0? this.PayslipsArr[1]:this.PayslipsArr[0]),
      aditionalCostComment:  new FormControl(this.cdcm.aditionalCostComment? this.cdcm.aditionalCostComment : '')

    });

    this.operationalCostForm.get('additional_costs').valueChanges.subscribe(value => {
      if (value > 0) {
        this.operationalCostForm.get('aditionalCostComment').setValidators(Validators.required);
      }else {
        this.operationalCostForm.get('aditionalCostComment').clearValidators();
      }
    });

    this.operationalCostForm.valueChanges.subscribe(()=>{
      if(this.basicInfoForm.valid) this.showOperationalCostMsgValidation=false;
    })
    this.operationalCostForm.get('hra_checkbox').valueChanges.subscribe(value => {
      this.changeHraIputsByValue(value)
    });

    this.operationalCostForm.get('payroll_checkbox').valueChanges.subscribe(value => {
      this.changePYIputsByValue(value);
    });
    this.changeHraIputsByValue(this.cdcm.isHra);
    this.changePYIputsByValue(this.cdcm.isPy);

    if (this.cdcm.statusID!==1){
      this.operationalCostForm.disable();
      this.basicInfoForm.disable();
    }
  }

  changeHraIputsByValue(value){
    if (!value) {
      this.operationalCostForm.get('HRA_Consultant').clearValidators();
      this.operationalCostForm.get('HRA_Consultant').setValue(null);
      this.operationalCostForm.get('HRA_percent_of_time').clearValidators();
      this.operationalCostForm.get('HRA_percent_of_time').setValue(null)

    }else {
      this.operationalCostForm.get('HRA_Consultant').setValidators(Validators.required);
      this.operationalCostForm.get('HRA_percent_of_time').setValidators(Validators.required);
    }
  }
  changePYIputsByValue(value){
    if (!value) {
      this.operationalCostForm.get('PY_Consultant').clearValidators();
      this.operationalCostForm.get('PY_Consultant').setValue(null)
      this.operationalCostForm.get('PY_percent_of_time').clearValidators();
      this.operationalCostForm.get('PY_percent_of_time').setValue(null);

    }else {
      this.operationalCostForm.get('PY_Consultant').setValidators(Validators.required);
      this.operationalCostForm.get('PY_percent_of_time').setValidators(Validators.required);
    }
  }



  calcEditCDCM(){

    if (!this.userService.can('change_deal_status')){
      this.dialogService.showMsgDialog("You don't have the right to change deals.");
      return
    }


    if (!this.basicInfoForm.valid){
      this.showBasicInfoMsgValidation = true;
    }
    if (!this.operationalCostForm.valid ){
      this.showOperationalCostMsgValidation = true;
    }
    if (this.operationalCostForm.valid && this.basicInfoForm.valid) {
      this.dialogService.showMultiOptionDialog({msg: 'Choose Your option.', options: ['Cancel', 'Calculate and Edit', 'Calculate']}).afterClosed().subscribe(option=>{
        this.basicInfoForm.value.disabled_people=this.basicInfoForm.get('disabled_people').value;
        this.basicInfoForm.value.dealID=this.cdcm.dealID;
        this.operationalCostForm.value.collective_insurance = this.collective_insurance;
        this.operationalCostForm.value.userID = this.userService.getUser().id;
        this.operationalCostForm.value.interest_rate  = this.cdcmService.cdcmStaticsList[2].valueDouble;
        this.operationalCostForm.value.franchise_fee = this.cdcm.franchise_fee_percent;
        this.operationalCostForm.get('payslips').value.num===1 ? this.operationalCostForm.value.payslipsCost = this.payslipsCost:this.operationalCostForm.value.payslipsCost=0;
        this.operationalCostForm.value.ID = this.cdcm.ID;
        switch (option){
          case 'Cancel':
            this.dialogRef.close();
            break;
          case 'Calculate and Edit':
            this.cdcmService.updateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value, cdcmTypeID: this.cdcm.typeID });
            break;
          case 'Calculate':
             this.cdcmService.calculateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value, cdcmTypeID: this.cdcm.typeID});
            break;
        }
      })
    }

  }


  onHRACHClick(){
    if (!this.operationalCostForm.get('payroll_checkbox').value){
      this.operationalCostForm.get('hra_checkbox').setValue(true);
    }
  }

  onPYCHClick(){
    if (!this.operationalCostForm.get('hra_checkbox').value){
      this.operationalCostForm.get('payroll_checkbox').setValue(true);
    }
  }

  cancel(){
    this.dialogRef.close()
  }

  getApprovalsByCdcmID(cdcmID) {
    this.rest.getApprovalsByCdcmID(cdcmID).subscribe(res=>{
      if(res.status===200){
        this.cdcmApproval = res.data;
        console.log(this.cdcmApproval)
      }
    })
  }
}
