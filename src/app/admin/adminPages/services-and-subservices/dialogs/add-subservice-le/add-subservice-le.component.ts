import {Component, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";
import {DialogService} from "../../../../../services/dialog.service";
import {LegalEntityService} from "../../../../../services/legal-entity.service";
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-add-subservice-le',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './add-subservice-le.component.html',
  styleUrl: './add-subservice-le.component.css'
})
export class AddSubserviceLeComponent implements OnInit {

  subserviceLEForm: FormGroup;

  currentSubservice;
  currentLe;

  constructor(public SANDS: ServicesAndSubservicesService, public leService: LegalEntityService, private dialogRef: MatDialogRef<AddSubserviceLeComponent>, public dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.subserviceLEForm = new FormGroup({
      subservice: new FormControl('', [Validators.required]),
      le: new FormControl('', [Validators.required])
    })
  }

  subserviceClick(subservice){
    this.currentSubservice = subservice;
  }

  leClick(le){
    this.currentLe = le;
  }

  create(){
    if (this.subserviceLEForm.valid){
      const data = {subserviceID: this.currentSubservice.ID, legalEntityID: this.currentLe.id}
      this.SANDS.createSubserviceLe(data, this.dialogRef);
    }
  }

}
