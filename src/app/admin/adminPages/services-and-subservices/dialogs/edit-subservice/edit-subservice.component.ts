import {Component, Inject, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";
import {ServiceModel} from "../../../../../models/serviceModel";
import {SubserviceModel} from "../../../../../models/subserviceModel";

@Component({
  selector: 'app-edit-subservice',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './edit-subservice.component.html',
  styleUrl: './edit-subservice.component.css'
})
export class EditSubserviceComponent implements OnInit {

  editSubserviceForm: FormGroup;
  currentService;

  constructor(@Inject(MAT_DIALOG_DATA) public subservice: any, public SANDS: ServicesAndSubservicesService, private dialogRef: MatDialogRef<EditSubserviceComponent>) {
    this.currentService = ServiceModel.createServiceModel({ID:subservice.serviceID ,name: subservice.serviceName});
  }

  ngOnInit(): void {
    this.editSubserviceForm = new FormGroup({
      subserviceName: new FormControl(this.subservice.name, [Validators.required]),
      service: new FormControl(this.subservice.serviceName, [Validators.required])
    })
  }

  serviceClick(service){
    this.currentService = service
  }

  edit(){
    if (this.editSubserviceForm.valid) {
      console.log(1)
      if (this.editSubserviceForm.value.subserviceName !== this.subservice.name || this.currentService.ID!==this.subservice.serviceID){
        console.log(2)
        // const data = {ID: this.subservice.ID, name: this.editSubserviceForm.value.subserviceName, serviceID: this.currentService.ID}
        const data = SubserviceModel.createSubserviceModel({ID: this.subservice.ID, name: this.editSubserviceForm.value.subserviceName, serviceID: this.currentService.ID, serviceName: this.currentService.name})
        this.SANDS.editSubservice(data, this.dialogRef);
      }
    }

  }

}
