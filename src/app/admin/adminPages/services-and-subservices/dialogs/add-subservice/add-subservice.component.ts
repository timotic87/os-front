import {Component, Inject, OnInit} from '@angular/core';
import {NgClass, NgFor, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";
import {MatDialogRef} from "@angular/material/dialog";
import {DialogService} from "../../../../../services/dialog.service";
import {RestService} from "../../../../../services/rest.service";

@Component({
  selector: 'app-add-subservice',
  standalone: true,
    imports: [
        NgIf,
        NgFor,
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

  flowOptions = [
    { value: 'none', label: 'None' },
    { value: 'type_1', label: 'REG (Recruiting)' },
    { value: 'type_2', label: 'STAFFING' },
    { value: 'type_3', label: 'HRA & PY' }
  ];

  constructor(public SANDS: ServicesAndSubservicesService, private matRef: MatDialogRef<AddSubserviceComponent>, private dialogService: DialogService, private rest: RestService) {}

  ngOnInit(): void {
    this.createSubserviceForm = new FormGroup({
      subserviceName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      service: new FormControl('', [Validators.required]),
      flowSelection: new FormControl('none')
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

  private parseFlowSelection(): { typeID: number | null, flowID: number | null } {
    const val = this.createSubserviceForm.value.flowSelection;
    if (!val || val === 'none') return { typeID: null, flowID: null };
    if (val.startsWith('type_')) return { typeID: parseInt(val.split('_')[1]), flowID: null };
    if (val.startsWith('flow_')) return { typeID: null, flowID: parseInt(val.split('_')[1]) };
    return { typeID: null, flowID: null };
  }

  create(){
    if (this.createSubserviceForm.valid) {
      const { typeID, flowID } = this.parseFlowSelection();
      const data = {
        name: this.createSubserviceForm.value.subserviceName,
        serviceID: this.currentService.ID,
        typeID,
        flowID
      };
      this.SANDS.createSubservice(data, this.matRef);
    }else {
      this.dialogService.showMsgDialog('Please fill in all required fields')
    }
  }

  serviceClick(service){
    this.currentService = service;
  }

}
