import {Component, Inject, Input, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";

@Component({
  selector: 'app-add-document-sub-type',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption
  ],
  templateUrl: './add-document-sub-type.component.html',
  styleUrl: './add-document-sub-type.component.css'
})
export class AddDocumentSubTypeComponent implements OnInit {

  docTypeForm: FormGroup;
  currentDocType: any;
  docTypes: any[];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private rest: RestService, public dialogRef: MatDialogRef<AddDocumentSubTypeComponent>,
              private dialogService: DialogService) {
  }

  ngOnInit(): void {
    this.docTypes = this.data.docTypes
    let name = null;
    let docTypeName = null;
    if(this.data.subType){
      name = this.data.subType.subTypeName;
      docTypeName = this.data.subType.DocumentType.typeName;
      this.currentDocType = this.data.subType.DocumentType;
    }
    this.docTypeForm = new FormGroup({
      docName: new FormControl(name, Validators.required),
      doctype: new FormControl(docTypeName, Validators.required)
    })
  }

  typeClick(type) {
    this.currentDocType = type;
  }

  create() {
    if (this.docTypeForm.valid) {
      this.rest.createDocumentSubType({
        subtypeName: this.docTypeForm.value.docName,
        type: this.currentDocType
      }).subscribe({
          next: (res) => {
            if (res.status === 200) {
              this.dialogRef.close(res.data);
            }
          },
          error: err => {
            this.dialogService.errorServDialog(err);
          }
        }
      );
    } else {
      this.dialogService.showMsgDialog('Document subtype name and type are required')
    }
  }

  close() {
    this.dialogRef.close();
  }

  edit(){
    let newdata = {ID: this.data.subType.ID, subTypeName: this.docTypeForm.value.docName, DocumentType: this.currentDocType};
    this.rest.updateDocumentSubtype(newdata).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dialogRef.close(res.data);
        }
      },
      error: err => {
        this.dialogService.errorServDialog(err);
      }
    })
  }


}
