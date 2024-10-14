import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-add-services',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgClass
  ],
  templateUrl: './add-services.component.html',
  styleUrl: './add-services.component.css'
})
export class AddServicesComponent implements OnInit {

  createServiceForm: FormGroup;

  constructor(private SANDS: ServicesAndSubservicesService, private matRef: MatDialogRef<AddServicesComponent>) {
  }

  ngOnInit(): void {
    this.createServiceForm = new FormGroup({
      serviceName: new FormControl('', [Validators.required, Validators.minLength(3)])
    })
  }

  create(){
    this.SANDS.createService({name: this.createServiceForm.value.serviceName}, this.matRef);
  }

}
