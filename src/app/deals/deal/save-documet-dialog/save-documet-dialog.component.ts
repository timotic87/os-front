import {Component, Inject, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../services/rest.service";
import {DialogService} from "../../../services/dialog.service";
import {DocumentService} from "../../../services/document.service";

@Component({
  selector: 'app-save-documet-dialog',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './save-documet-dialog.component.html',
  styleUrl: './save-documet-dialog.component.css'
})
export class SaveDocumetDialogComponent implements OnInit {

  docForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private rest: RestService, private dialogRef: MatDialogRef<SaveDocumetDialogComponent>,
              private dialogService: DialogService, private documentService: DocumentService) {
  }

  ngOnInit(): void {
    this.docForm = new FormGroup({
      docName: new FormControl(null, [Validators.required])
    });
    }

  save(){
    const file = this.data.file;
    const deal = this.data.deal;
    let formParams = new FormData();
    formParams.append('file', file as File);
    formParams.set('filePath', deal.client.name);
    formParams.set('fileName', this.docForm.value.docName);
    formParams.set('clientId', (deal.client.id).toString());
    formParams.set('dealID', (deal.ID).toString());
    formParams.set('documetTypeID', this.data.documetTypeID.toString());
    formParams.set('docSubTypeID', this.data.docSubTypeID.toString());

    this.rest.saveFileSys(formParams).subscribe({
      next: (result) => {
        console.log(result)
        if (result.status===200) {
          this.documentService.activeDocumentChange.next(result.data);
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.dialogService.showERRMsgDialog(err);
      }
    });

  }

  close() {
    this.dialogRef.close();
  }

}
