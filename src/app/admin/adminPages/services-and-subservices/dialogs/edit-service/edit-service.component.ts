import {Component, Inject, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";

@Component({
  selector: 'app-edit-service',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './edit-service.component.html',
  styleUrl: './edit-service.component.css'
})
export class EditServiceComponent implements OnInit {

  editServiceForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public service: any, private SANDS: ServicesAndSubservicesService, private dialogRef: MatDialogRef<EditServiceComponent>) {
  }

  ngOnInit(): void {
    this.editServiceForm = new FormGroup({
      serviceName: new FormControl(this.service.name, [Validators.required, Validators.minLength(3)])
    });
    }

  edit(){
    const data = {name: this.editServiceForm.value.serviceName, ID: this.service.ID}
    this.SANDS.editService(data, this.dialogRef);
  }

}
