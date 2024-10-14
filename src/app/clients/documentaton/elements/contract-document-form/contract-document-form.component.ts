import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {PickFileComponent} from "../pick-file/pick-file.component";
import {MatDialog} from "@angular/material/dialog";
import {ClientModel} from "../../../../models/clientModel";
import {RestService} from "../../../../services/rest.service";
import {emit} from "@angular-devkit/build-angular/src/tools/esbuild/angular/compilation/parallel-worker";

@Component({
  selector: 'app-contract-document-form',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass,
    PickFileComponent
  ],
  templateUrl: './contract-document-form.component.html',
  styleUrl: './contract-document-form.component.css'
})
export class ContractDocumentFormComponent implements OnInit {

  @Output() formGroupp = new EventEmitter<FormGroup>()

  addContractForm: FormGroup;
  file: File = null;

  constructor() {
  }

  ngOnInit(): void {
    this.addContractForm = new FormGroup({
      fileName: new FormControl(null, [Validators.required, Validators.minLength(5)]),
      isExpired: new FormControl(false),
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      reciveNotification: new FormControl(false)
    });
    this.addContractForm.get('fileName').valueChanges.subscribe(() => {
      this.emitFormGroup()
    })
    this.addContractForm.get('isExpired').valueChanges.subscribe(() => {
      this.emitFormGroup()
    })
    this.addContractForm.get('startDate').valueChanges.subscribe(() => {
      this.emitFormGroup()
    })
    this.addContractForm.get('endDate').valueChanges.subscribe(() => {
      this.emitFormGroup()
    })
    this.addContractForm.get('reciveNotification').valueChanges.subscribe(() => {
      this.emitFormGroup()
    })
  }

  isExpiredChange(){
      this.addContractForm.get('startDate').setValue(null);
      this.addContractForm.get('endDate').setValue(null);
      this.addContractForm.get('reciveNotification').setValue(false);
    this.addContractForm.get('startDate').clearValidators();
    this.addContractForm.get('endDate').clearValidators();
      if(this.addContractForm.get('isExpired').value){
        this.addContractForm.get('startDate').addValidators(Validators.required);
        this.addContractForm.get('endDate').addValidators(Validators.required);
      }
    this.addContractForm.get('startDate').updateValueAndValidity();
    this.addContractForm.get('endDate').updateValueAndValidity();
  }

  emitFormGroup(){
    this.formGroupp.emit(this.addContractForm);
  }

}
