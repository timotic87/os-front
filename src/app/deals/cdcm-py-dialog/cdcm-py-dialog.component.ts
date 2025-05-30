import {Component, Inject, OnInit} from '@angular/core';
import {CurrencyPipe, NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {CDCMService} from "../../services/cdcm.service";
import {DialogService} from "../../services/dialog.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
@Component({
  selector: 'app-cdcm-py-dialog',
  standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgClass,
        CurrencyPipe,
        NgIf
    ],
  templateUrl: './cdcm-py-dialog.component.html',
  styleUrl: './cdcm-py-dialog.component.css'
})
export class CdcmPyDialogComponent implements OnInit {

  basicInfoForm: FormGroup;
  operationalCostForm: FormGroup;

  payslipsCost = 0;

  PayslipsArr= [{name: 'NO', num: 0},{name: 'YES', num: 1}];

  showBasicInfoMsgValidation = false;
  showOperationalCostMsgValidation = false;

  constructor(public cdcmService: CDCMService, private dialogService: DialogService, @Inject(MAT_DIALOG_DATA) public deal: any,
              private dialogRef: MatDialogRef<CdcmPyDialogComponent>) {
    cdcmService.calculationCDCM = null;
  }

  ngOnInit(): void {
        this.basicInfoForm = new FormGroup({
          No_of_employees: new FormControl(),
          price_of_employee: new FormControl(),
          due_days_on_fee: new FormControl()
        });
    this.basicInfoForm.get('No_of_employees').valueChanges.subscribe(value => {
      this.payslipsCost = value * this.cdcmService.cdcmStaticsList[1].valueDouble;
    });

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

        this.basicInfoForm.value.dealID = this.deal.ID;
        this.basicInfoForm.value.subservice = this.deal.subservice
        this.operationalCostForm.value.interest_rate  = this.cdcmService.cdcmStaticsList[2].valueDouble;
        this.operationalCostForm.get('payslips').value.num===1 ? this.operationalCostForm.value.payslipsCost = this.payslipsCost:this.operationalCostForm.value.payslipsCost=0;
        this.operationalCostForm.value.franchise_fee = this.deal.legalEntity.franchise_fee;

        console.log(option)
        switch (option){
          case 'Cancel':
            break;
          case 'Calculate and Save':
            this.cdcmService.calculateAndCreateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value, cdcmTypeID: 2}, this.dialogRef);

            break;
          case 'Calculate':
            this.cdcmService.calculateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value, cdcmTypeID: 2});

            break;
        }
      })
    }
  }

  cancel(){

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

}
