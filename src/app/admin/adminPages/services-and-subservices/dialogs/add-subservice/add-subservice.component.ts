import {Component, Inject, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";
import {MatDialogRef} from "@angular/material/dialog";
import {DialogService} from "../../../../../services/dialog.service";

@Component({
  selector: 'app-add-subservice',
  standalone: true,
    imports: [
        NgIf,
        ReactiveFormsModule,
        NgClass,
        MatAutocomplete,
        MatAutocompleteTrigger,
        MatOption
    ],
  templateUrl: './add-subservice.component.html',
  styleUrl: './add-subservice.component.css'
})
export class AddSubserviceComponent implements OnInit {

  createSubserviceForm: FormGroup;
  currentService;

  constructor(public SANDS: ServicesAndSubservicesService, private matRef: MatDialogRef<AddSubserviceComponent>, private dialogService: DialogService) {}

  ngOnInit(): void {
    this.createSubserviceForm = new FormGroup({
      subserviceName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      service: new FormControl('', [Validators.required])
    })
    }


  create(){
    if (this.createSubserviceForm.valid) {
      const data = {name: this.createSubserviceForm.value.subserviceName, serviceID:this.currentService.ID};
      this.SANDS.createSubservice(data, this.matRef);
    }else {
      this.dialogService.showMsgDialog('Fill all the bvlanks!')
    }
  }

  serviceClick(service){
    this.currentService = service;
  }

}
