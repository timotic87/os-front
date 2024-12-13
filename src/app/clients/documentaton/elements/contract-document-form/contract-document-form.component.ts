import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DialogService} from "../../../../services/dialog.service";

@Component({
  selector: 'app-contract-document-form',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './contract-document-form.component.html',
  styleUrl: './contract-document-form.component.css'
})
export class ContractDocumentFormComponent implements OnInit {

  @Output() formGroupp = new EventEmitter<FormGroup>()

  addContractForm: FormGroup;
  file: File = null;

  constructor(private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.addContractForm = new FormGroup({
      fileName: new FormControl(null, [Validators.required, Validators.minLength(5)]),
      isExpired: new FormControl(false),
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      reciveNotification: new FormControl(false)
    });
    this.addContractForm.get('fileName').valueChanges.subscribe(value => {

      const forbiddenChars = [".", "/", "\\", ":", "*", "?", "\"", "<", ">", "|"];

      if (value.length > 0) {
        const lastChar = value[value.length - 1];
        if (forbiddenChars.includes(lastChar)) {
          this.dialogService.showSnackBar(`Poslednji karakter '${lastChar}' je zabranjen.`, '', 3000);
          this.addContractForm.get('fileName').setValue(value.slice(0, -1));
        }
      }




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
