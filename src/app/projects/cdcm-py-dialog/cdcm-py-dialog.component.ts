import {Component, OnInit} from '@angular/core';
import {NgClass} from "@angular/common";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-cdcm-py-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './cdcm-py-dialog.component.html',
  styleUrl: './cdcm-py-dialog.component.css'
})
export class CdcmPyDialogComponent implements OnInit {

  basicInfoForm: FormGroup;
  operationalCostForm: FormGroup;

  constructor() {
  }

  ngOnInit(): void {
        this.basicInfoForm = new FormGroup({
          No_of_employees: new FormControl(),
          price_of_employee: new FormControl(),
          other_cost: new FormControl(),
          due_days_on_fee: new FormControl(),
        });

        this.operationalCostForm = new FormGroup({

        });
    }

  calculateSave(){

  }

  cancel(){

  }

}
