import {Component, Inject, OnInit} from '@angular/core';
import {CurrencyPipe, NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CDCMService} from "../../services/cdcm.service";
import {DialogService} from "../../services/dialog.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UserService} from "../../services/user.service";
import {CDCM} from "../../models/cdcm";
import {ApprovalModel} from "../../models/approval/approvalModel";
import {ApprovalCardComponent} from "../../customComponents/approval-card/approval-card.component";
import {RestService} from "../../services/rest.service";
import {ApprovalStepModel} from "../../models/approval/ApprovalStepModel";
import {ApprovalStatus} from "../../models/approval/approvalStatus";
import {ProjectModel} from "../../models/projectModel";

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

  approval: ApprovalModel;

  cdcm: CDCM;
  project: ProjectModel;


  constructor(public cdcmService: CDCMService, private dialogService: DialogService, @Inject(MAT_DIALOG_DATA) public data: any,
              private dialogRef: MatDialogRef<CdcmViewEditComponent>, private userService: UserService, private rest: RestService) {
        this.cdcm = this.data.cdcm
        this.project = this.data.project;
        cdcmService.seniorityListListener.subscribe(()=>{
      if (this.cdcm.isHra){
        this.operationalCostForm.get('HRA_Consultant').setValue(cdcmService.getSeniorityObjByName(this.cdcm.hra_conultant_seniority));
      }
      if (this.cdcm.isPy){
        console.log(cdcmService.getSeniorityObjByName(this.cdcm.py_conultant_seniority))
        this.operationalCostForm.get('PY_Consultant').setValue(cdcmService.getSeniorityObjByName(this.cdcm.py_conultant_seniority));
        this.payslipsCost=this.cdcm.payslips_cost;
      }
    });

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
    if (this.cdcm){
      this.rest.getApprovalsByCdcmID(this.cdcm.ID).subscribe(res=>{
        if (res.status === 200) {
          let approvalSeps: ApprovalStepModel[] = [];

          for (let item of res.data) {
            approvalSeps.push(new ApprovalStepModel(item.ApprovalStepID, item.approvalID,
              item.userID, item.firstName, item.lastName, item.stepOrder, new ApprovalStatus(item.approvalStepStatusID,
                item.approvalStepStatusName), item.approvalStepStatusChangeDate, item.profilePicUrl, item.comment));
          }

          this.approval =  new ApprovalModel(res.data[0].approvalID, res.data[0].cdcmID, res.data[0].documentID, res.data[0].approvalCreatedDate, res.data[0].isSequential,
            new ApprovalStatus(res.data[0].approvalStatusID, res.data[0].approvalStatusName), approvalSeps);

        }
      });
    }

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
      aditionalCostComment:  new FormControl(this.cdcm.aditionalCostComment, [Validators.required])

    });

    this.operationalCostForm.get('additional_costs').valueChanges.subscribe(value => {
      if (value > 0) {
        this.operationalCostForm.get('aditionalCostComment').setValidators(Validators.required);
      }else {
        this.operationalCostForm.get('aditionalCostComment').clearValidators();
      }
    });

    if (this.cdcmService.cdcmSeniorityList){
      if (this.cdcm.isHra){
        this.operationalCostForm.get('HRA_Consultant').setValue(this.cdcmService.getSeniorityObjByName(this.cdcm.hra_conultant_seniority));
      }
      if (this.cdcm.isPy){
        this.operationalCostForm.get('PY_Consultant').setValue(this.cdcmService.getSeniorityObjByName(this.cdcm.py_conultant_seniority));
        this.payslipsCost=this.cdcm.payslips_cost;
      }
    }
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
    if (!this.basicInfoForm.valid){
      this.showBasicInfoMsgValidation = true;
    }
    if (!this.operationalCostForm.valid ){
      this.showOperationalCostMsgValidation = true;
    }
    if (this.operationalCostForm.valid && this.basicInfoForm.valid) {
      this.dialogService.showMultiOptionDialog({msg: 'Choose Your option.', options: ['Cancel', 'Calculate and Edit', 'Calculate']}).afterClosed().subscribe(option=>{
        this.basicInfoForm.value.subservice = this.project.subservice
        this.basicInfoForm.value.disabled_people=this.basicInfoForm.get('disabled_people').value;
        this.basicInfoForm.value.projectID=this.cdcm.projectID;
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
            this.cdcmService.updateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value});
            break;
          case 'Calculate':
             this.cdcmService.calculateCDCM({...this.basicInfoForm.value, ...this.operationalCostForm.value});
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
