import {Component, Inject, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../services/rest.service";
import {DialogService} from "../../../services/dialog.service";

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
              private dialogService: DialogService) {
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

    this.rest.saveFileSys(formParams).subscribe({
      next: (result) => {
        if (result.status===200) {
          console.log(result);
        }
      },
      error: (err) => {
        this.dialogService.showERRMsgDialog(err);
      }
    })

    //
    // this.rest.saveFile(formParams).subscribe(res => {
    //   if (res.status === 201) {
    //     this.dialogService.showSnackBar('Successfully saved document', '',5000);
    //     this.clientService.addDocumentSub.next(true);
    //
    //     return;
    //   }else{
    //     this.dialogService.errorDialog(res);
    //     this.dialogRef.close();
    //   }
    //
    //   this.dialogService.showSnackBar(res.data.name+' '+res.data.num, '', 5000)
    // })

  }

  close() {
    this.dialogRef.close();
  }

}
