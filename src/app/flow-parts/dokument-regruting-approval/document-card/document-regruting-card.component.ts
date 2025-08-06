import {Component, Input} from '@angular/core';
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {DatePipe} from "@angular/common";
import {ColorLabelComponent} from "../../../customComponents/color-label/color-label.component";
import {RestService} from "../../../services/rest.service";
import {DialogService} from "../../../services/dialog.service";
import {DocumentService} from "../../../services/document.service";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-document-regruting-card',
  standalone: true,
  imports: [
    DatePipe,
    ColorLabelComponent
  ],
  templateUrl: './document-regruting-card.component.html',
  styleUrl: './document-regruting-card.component.css'
})
export class DocumentRegrutingCardComponent {

  pdfSrc: any=null;

  @Input() approvalID: any;
  constructor(private rest: RestService, private dialogService: DialogService, public documentService: DocumentService, private matDialog: MatDialog) {
  }


  showFile(){
    window.open(`/documentview/${this.documentService.activeDocument.ID}`, '_blank');
  }

  delete(){
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isdelete=>{
      if (isdelete){
        this.dialogService.showLoader()
        this.rest.deleteDocumentById(this.documentService.activeDocument.ID, this.documentService.activeDocument.fileName).subscribe({
          next: res=>{
            this.dialogService.closeLoader()
            if (res.status === 200){
              this.documentService.activeDocumentChange.next(null);
              window.location.reload();
              window.scrollTo(0, document.body.scrollHeight);
              this.dialogService.showSnackBar('Successfuly deleted document', '', 4000);
            }else {
              this.dialogService.errorDialog(res);
            }
          },
          error:err=>{
            this.dialogService.closeLoader();
            this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
          }

        })
      }
    });
  }

  submitDocument(){
    this.dialogService.showChooseDialog("Da li je ovo krovna ponuda?").afterClosed().subscribe(isYes=>{
      if (isYes){
        this.dialogService.showChooseDialog('Da li siguran da zelis da pokrenes approval').afterClosed().subscribe(isYes=>{
          if (isYes){
            this.documentService.startApproval(this.documentService.activeDocument.ID, this.approvalID, this.documentService.activeDocument.dealID);
            return;
          }
        });
      }
      //todo zakljucavanje bez dialoga kako bi krenuli dalje i promena statusa deala

    });
  }

  download(){
    this.rest.downloadFile(this.documentService.activeDocument.ID).subscribe(res => {
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = this.documentService.activeDocument.fileName; // Ovde zadaješ ime
      a.click();

      // Opciono: oslobodi memoriju
      URL.revokeObjectURL(url);
    });
  }

}
