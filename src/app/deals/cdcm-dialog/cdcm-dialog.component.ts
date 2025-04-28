import {Component, Inject, OnInit} from '@angular/core';
import {CurrencyPipe, NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CDCMService} from "../../services/cdcm.service";
import {DialogService} from "../../services/dialog.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserService} from "../../services/user.service";
import {RestService} from "../../services/rest.service";

@Component({
  selector: 'app-cdcm-dialog',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass,
    CurrencyPipe
  ],
  templateUrl: './cdcm-dialog.component.html',
  styleUrl: './cdcm-dialog.component.css'
})
export class CdcmDialogComponent implements OnInit {

  ChargingDPArr= [{name: 'NO', num: 0},{name: 'YES', num: 1}];
  PayslipsArr= [{name: 'NO', num: 0},{name: 'YES', num: 1}];
  feeTypes= [{name: 'Markup', num: 0},{name: 'Flat', num: 1}];

  basicInfoForm: FormGroup;
  operationalCostForm: FormGroup;

  showBasicInfoMsgValidation = false;
  showOperationalCostMsgValidation = false;

  collective_insurance = 0
  payslipsCost = 0;

  constructor(public rest: RestService, public cdcmService: CDCMService, private dialogService: DialogService, @Inject(MAT_DIALOG_DATA) public deal,
              private dialogRef: MatDialogRef<CdcmDialogComponent>, private userService: UserService) {
    cdcmService.calculationCDCM = null;
  }

  ngOnInit(): void {
    this.basicInfoForm = new FormGroup({
      No_of_employees: new FormControl(null, [Validators.required]),
      Grand_Groos_Salaray_per_Employee: new FormControl(null, [Validators.required]),
      other_cost: new FormControl(null, [Validators.required]),
      disabled_people: new FormControl({value: 0, disabled: true}),
      Charging_DP: new FormControl({value: this.ChargingDPArr[0], disabled: true}),
      feeTypes: new FormControl(this.feeTypes[0]),
      MU_on_salary: new FormControl(null, [Validators.required]),
      MU_on_costs: new FormControl(null, [Validators.required]),
      MU_on_disabled_people: new FormControl(null),
      Flat_fee: new FormControl({value: null, disabled: true}),
      due_days_on_cost: new FormControl(null, [Validators.required]),
      due_days_on_fee: new FormControl(null, [Validators.required])
    });
    this.basicInfoForm.get('No_of_employees').valueChanges.subscribe(value => {
      this.collective_insurance = value * this.cdcmService.cdcmStaticsList[0].valueDouble;
      this.payslipsCost = value * this.cdcmService.cdcmStaticsList[1].valueDouble;

      if (value > 19) {
        this.basicInfoForm.get('disabled_people').setValue(this.cdcmService.getDisabledPeople(value));
        this.basicInfoForm.get('Charging_DP').enable();
      } else {
        this.basicInfoForm.get('disabled_people').setValue(0);
        this.basicInfoForm.get('Charging_DP').setValue(this.ChargingDPArr[0]);
        this.basicInfoForm.get('Charging_DP').disable();
      }
    });
    this.basicInfoForm.get('feeTypes').valueChanges.subscribe(value => {
      if (value.num === 0) {
        this.basicInfoForm.get('Flat_fee').disable();
        this.basicInfoForm.get('Flat_fee').clearValidators();
        this.basicInfoForm.get('MU_on_salary').enable();
        this.basicInfoForm.get('MU_on_costs').enable();
        this.basicInfoForm.get('MU_on_salary').setValidators([Validators.required]);
        this.basicInfoForm.get('MU_on_costs').setValidators([Validators.required]);
      } else {
        this.basicInfoForm.get('Flat_fee').enable();
        this.basicInfoForm.get('Flat_fee').setValidators([Validators.required]);
        this.basicInfoForm.get('MU_on_salary').disable();
        this.basicInfoForm.get('MU_on_costs').disable();
        this.basicInfoForm.get('MU_on_salary').clearValidators();
        this.basicInfoForm.get('MU_on_costs').clearValidators();
      }
    })
    this.basicInfoForm.get('Charging_DP').valueChanges.subscribe(value => {
      if (value.num === 0) {
        this.basicInfoForm.get('MU_on_disabled_people').disable();
        this.basicInfoForm.get('MU_on_disabled_people').clearValidators();
      } else {
        this.basicInfoForm.get('MU_on_disabled_people').enable();
        this.basicInfoForm.get('MU_on_disabled_people').setValidators([Validators.required]);
      }
    })
    this.basicInfoForm.valueChanges.subscribe(() => {
      if (this.basicInfoForm.valid) this.showBasicInfoMsgValidation = false;
    })


    this.operationalCostForm = new FormGroup({
      hra_checkbox: new FormControl(true),
      payroll_checkbox: new FormControl(true),
      HRA_Consultant: new FormControl('', Validators.required),
      HRA_percent_of_time: new FormControl('', Validators.required),
      PY_Consultant: new FormControl('', Validators.required),
      PY_percent_of_time: new FormControl('', Validators.required),
      additional_costs: new FormControl(0, Validators.required),
      payslips: new FormControl(this.PayslipsArr[1]),
      aditionalCostComment:  new FormControl(null)
    });
    this.operationalCostForm.get('additional_costs').valueChanges.subscribe(value => {
      if (value > 0) {
        this.operationalCostForm.get('aditionalCostComment').setValidators(Validators.required);
      }else {
        this.operationalCostForm.get('aditionalCostComment').clearValidators();
      }
    });

    this.operationalCostForm.valueChanges.subscribe(() => {
      if (this.basicInfoForm.valid) this.showOperationalCostMsgValidation = false;
    })
    this.operationalCostForm.get('hra_checkbox').valueChanges.subscribe(value => {
      this.changeHraIputsByValue(value)
    });

    this.operationalCostForm.get('payroll_checkbox').valueChanges.subscribe(value => {
      this.changePYIputsByValue(value);
    });
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

  calculateSave(){

    if (!this.basicInfoForm.valid){
      this.showBasicInfoMsgValidation = true;
    }
    if (!this.operationalCostForm.valid ){
      this.showOperationalCostMsgValidation = true;
    }
    if (this.operationalCostForm.valid && this.basicInfoForm.valid) {
      this.dialogService.showMultiOptionDialog({msg: 'Choose Your option.', options: ['Cancel', 'Calculate and Save', 'Calculate']}).afterClosed().subscribe(option=>{
        this.basicInfoForm.value.disabled_people=this.basicInfoForm.get('disabled_people').value;
        this.basicInfoForm.value.dealID= this.deal.ID;
        this.basicInfoForm.value.subservice = this.deal.subservice
        this.basicInfoForm.value.createdUserID= this.userService.getUser().id;
        this.operationalCostForm.value.collective_insurance = this.collective_insurance;
        this.operationalCostForm.value.interest_rate  = this.cdcmService.cdcmStaticsList[2].valueDouble;
        this.operationalCostForm.get('payslips').value.num===1 ? this.operationalCostForm.value.payslipsCost = this.payslipsCost:this.operationalCostForm.value.payslipsCost=0;
        this.operationalCostForm.value.franchise_fee = this.deal.legalEntity.franchise_fee;

        switch (option){
          case 'Cancel':
            break;
          case 'Calculate and Save':
            this.cdcmService.calculateAndCreateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value}, this.dialogRef);

            break;
          case 'Calculate':
            this.cdcmService.calculateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value, cdcmTypeID: 1});

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


}
