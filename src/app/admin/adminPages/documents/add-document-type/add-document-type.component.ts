import {Component, Inject, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";
import {Subject} from "rxjs";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-add-document-type',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './add-document-type.component.html',
  styleUrl: './add-document-type.component.css'
})
export class AddDocumentTypeComponent implements OnInit {

  docTypeForm: FormGroup;

  constructor(private rest: RestService, private dialogService: DialogService, private dialogRef: MatDialogRef<AddDocumentTypeComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit(): void {
    let name = null
    let iss = false;
    if (this.data) {
      name = this.data.documentType.typeName;
      iss = this.data.documentType.isSystem;
    }
    this.docTypeForm = new FormGroup({
      docName: new FormControl(name, Validators.required),
      isSystem: new FormControl(iss)
    })
  }

  create() {
    if (this.docTypeForm.valid) {
      this.rest.createDocumentType(this.docTypeForm.value).subscribe({
          next: result => {
            if (result.status == 200) {
              this.dialogRef.close(result.data);
            }
          },
          error: err => {
            this.dialogService.errorServDialog(err);
          }
        }
      );
    } else {
      this.dialogService.showMsgDialog('Document type name is required')
    }
  }

  close() {
    this.dialogRef.close();
  }

  edit() {
    let newdata = {ID: this.data.documentType.ID, ...this.docTypeForm.value};
    this.rest.updateDocumentType(newdata).subscribe({
      next: result => {
        if (result.status == 200) {
          this.dialogRef.close(result.data);
        }
      },
      error: err => {
        this.dialogService.errorServDialog(err);
      }
    })
  }

}
