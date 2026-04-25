import {Component, Inject, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgFor, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";
import {ServiceModel} from "../../../../../models/serviceModel";
import {SubserviceModel} from "../../../../../models/subserviceModel";
import {RestService} from "../../../../../services/rest.service";

@Component({
  selector: 'app-edit-subservice',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    NgFor,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './edit-subservice.component.html',
  styleUrl: './edit-subservice.component.css'
})
export class EditSubserviceComponent implements OnInit {

  editSubserviceForm: FormGroup;
  currentService;

  flowOptions = [
    { value: 'none', label: 'None' },
    { value: 'type_1', label: 'REG (Recruiting)' },
    { value: 'type_2', label: 'STAFFING' },
    { value: 'type_3', label: 'HRA & PY' }
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public subservice: any, public SANDS: ServicesAndSubservicesService, private dialogRef: MatDialogRef<EditSubserviceComponent>, private rest: RestService) {
    this.currentService = ServiceModel.createServiceModel({ID:subservice.serviceID ,name: subservice.serviceName});
  }

  ngOnInit(): void {
    // Determine initial flow selection
    let initialFlow = 'none';
    if (this.subservice.flowID) {
      initialFlow = 'flow_' + this.subservice.flowID;
    } else if (this.subservice.typeID) {
      initialFlow = 'type_' + this.subservice.typeID;
    }

    this.editSubserviceForm = new FormGroup({
      subserviceName: new FormControl(this.subservice.name, [Validators.required]),
      service: new FormControl(this.subservice.serviceName, [Validators.required]),
      flowSelection: new FormControl(initialFlow)
    });
    this.loadCustomFlows();
  }

  private loadCustomFlows(): void {
    this.rest.getFlows().subscribe(res => {
      if (res.status === 200 && res.data) {
        for (const flow of res.data) {
          this.flowOptions.push({ value: 'flow_' + flow.ID, label: flow.name });
        }
      }
    });
  }

  serviceClick(service){
    this.currentService = service
  }

  private parseFlowSelection(): { typeID: number | null, flowID: number | null } {
    const val = this.editSubserviceForm.value.flowSelection;
    if (!val || val === 'none') return { typeID: null, flowID: null };
    if (val.startsWith('type_')) return { typeID: parseInt(val.split('_')[1]), flowID: null };
    if (val.startsWith('flow_')) return { typeID: null, flowID: parseInt(val.split('_')[1]) };
    return { typeID: null, flowID: null };
  }

  edit(){
    this.editSubserviceForm.markAllAsTouched();
    if (this.editSubserviceForm.valid) {
      const f = this.editSubserviceForm.value;
      const { typeID, flowID } = this.parseFlowSelection();

      const data = {
        ID: this.subservice.ID,
        name: f.subserviceName,
        serviceID: this.currentService.ID,
        serviceName: this.currentService.name,
        typeID,
        flowID
      };
      this.SANDS.editSubservice(data, this.dialogRef);
    }
  }

}
