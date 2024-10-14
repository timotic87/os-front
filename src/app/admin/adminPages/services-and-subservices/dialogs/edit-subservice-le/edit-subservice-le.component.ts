import {Component, Inject, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ServicesAndSubservicesService} from "../../../../../services/services-and-subservices.service";
import {LegalEntityService} from "../../../../../services/legal-entity.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-edit-subservice-le',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './edit-subservice-le.component.html',
  styleUrl: './edit-subservice-le.component.css'
})
export class EditSubserviceLeComponent implements OnInit {

  subserviceLEForm: FormGroup;
  current_LE_ID;
  current_subservice_ID;

  constructor(public SANDS: ServicesAndSubservicesService, public leService: LegalEntityService, @Inject(MAT_DIALOG_DATA) public connectionobj, private dialogRef: MatDialogRef<EditSubserviceLeComponent>) {
    console.log(connectionobj)
    this.current_LE_ID = connectionobj.legalentityID;
    this.current_subservice_ID = connectionobj.subserviceID;
  }

  ngOnInit(): void {
        this.subserviceLEForm = new FormGroup({
          subservice: new FormControl(this.connectionobj.subserviceName, [Validators.required]),
          le: new FormControl(this.connectionobj.legalentityName, [Validators.required])
        })
    }

  subserviceClick(subservice){
    this.current_subservice_ID = subservice.ID;
  }

  leClick(le){
    this.current_LE_ID = le.id;
  }

  edit(){
    if (this.subserviceLEForm.valid){
      if (this.current_LE_ID!==this.connectionobj.legalentityID || this.current_subservice_ID!==this.connectionobj.subserviceID){
        const data = {ID: this.connectionobj.ID, subserviceID: this.current_subservice_ID, legalEntityID: this.current_LE_ID};
        this.SANDS.editSubserviceLE(data, this.dialogRef);
      }
    }
  }
}
