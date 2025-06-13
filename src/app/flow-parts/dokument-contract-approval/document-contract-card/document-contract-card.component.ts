import {Component, Input} from '@angular/core';
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {DatePipe} from "@angular/common";
import {ColorLabelComponent} from "../../../customComponents/color-label/color-label.component";
import {RestService} from "../../../services/rest.service";
import {DialogService} from "../../../services/dialog.service";
import {DocumentService} from "../../../services/document.service";

@Component({
  selector: 'app-document-contract-card',
  standalone: true,
  imports: [
    DatePipe,
    ColorLabelComponent
  ],
  templateUrl: './document-contract-card.component.html',
  styleUrl: './document-contract-card.component.css'
})
export class DocumentContractCardComponent {

  @Input() document: any;
  @Input() approvalID: any;

  constructor(private rest: RestService, private dialogService: DialogService, private documentService: DocumentService) {
  }


  showFile(){
    window.open(`/documentview/${this.documentService.activeDocument.ID}`, '_blank');

  }

  delete(){
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isdelete=>{
      if (isdelete){
        this.dialogService.showLoader();
        this.rest.deleteDocumentById(this.document.ID, this.document.fileName).subscribe({
          next: res => {
            if (res.status === 200){
              this.dialogService.closeLoader();
              window.location.reload();
              window.scrollTo(0, document.body.scrollHeight);
              this.dialogService.showSnackBar('Successfuly deleted document', '', 4000);
            }else {
              this.dialogService.errorDialog(res);
            }
          },
          error: err => {
            this.dialogService.closeLoader();
            this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
          }

        })
      }
    });
  }

  submitDocument(){
    this.documentService.startApproval(this.document.ID, this.approvalID, this.document.dealID);
  }

  download(){
    this.rest.downloadFile(this.document.ID).subscribe(res => {
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = this.document.fileName; // Ovde zadaješ ime
      a.click();

      // Opciono: oslobodi memoriju
      URL.revokeObjectURL(url);
    });
  }

}
