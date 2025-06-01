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
    this.rest.getFile(this.document.ID).subscribe(res=>{
      let blob:Blob=res as Blob;
      let myBlob= new Blob([blob], {type: 'application/pdf'})
      const newWindow = window.open();
      newWindow.document.write(`<iframe src="${URL.createObjectURL(myBlob)}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    });
  }

  delete(){
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isdelete=>{
      if (isdelete){
        this.rest.deleteDocumentById(this.document.ID, this.document.fileName).subscribe(res=>{
          if (res.status === 200){
            //todo update front
            this.dialogService.showSnackBar('Successfuly deleted document', '', 4000);
          }else {
            this.dialogService.errorDialog(res);
          }
        })
      }
    });
  }

  submitDocument(){
    this.documentService.startApproval(this.document.ID, this.approvalID, this.document.dealID);
  }

  download(){
    this.rest.getFile(this.document.ID).subscribe(res => {
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
