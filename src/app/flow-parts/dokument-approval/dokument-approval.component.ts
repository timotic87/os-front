import {Component, Input, OnInit} from '@angular/core';
import {SaveDocumetDialogComponent} from "../../deals/deal/save-documet-dialog/save-documet-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {NgIf} from "@angular/common";
import {DocumentService} from "../../services/document.service";
import {ApprovalCardComponent} from "../../customComponents/approval-card/approval-card.component";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {DocumentCardComponent} from "./document-card/document-card.component";

@Component({
  selector: 'app-dokument-approval',
  standalone: true,
  imports: [
    NgIf,
    ApprovalCardComponent,
    MatMenu,
    MatMenuTrigger,
    DocumentCardComponent
  ],
  templateUrl: './dokument-approval.component.html',
  styleUrl: './dokument-approval.component.css'
})
export class DokumentApprovalComponent implements OnInit {

  @Input() deal: any;
  @Input() docTypeID: any;
  @Input() docSubTypeID: any;
  @Input() statusIDShow: any;
  @Input() type: 'offer' | 'contract' = 'offer';
  @Input() approvalID = 2;

  docApproval: any;

  constructor(public matDialog: MatDialog, public rest: RestService, public dialogService: DialogService, public documentService: DocumentService ) {
    documentService.approvalStart.subscribe(approval => {
      this.getApprovalByDocID();
    });

  }

  ngOnInit(): void {
    this.getActiveOffer();
    this.getInaciveOfferDocs();

    }


  openFileExplorer(fileInput: HTMLInputElement) {
    fileInput.click();
  }



  onFileSelected(event: Event){
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Ovde možeš proveriti da li je zaista PDF
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
      }

      this.matDialog.open(SaveDocumetDialogComponent, {
        width: '600px',
        data: {file: file, deal: this.deal, documetTypeID:this.docTypeID, docSubTypeID:this.docSubTypeID},
      });
    }
  }

  getActiveOffer(){
    this.rest.getActiveFileListByDealIdAndTypeId({dealID: this.deal.ID, typeID: this.docTypeID}).subscribe({
      next: res => {
        if(res.status===200){
          this.documentService.activeDocumentChange.next(res.data);
          this.getApprovalByDocID();
        }
      },
      error: err => {
        console.log(err)
        this.dialogService.showERRMsgDialog(err)
      }
    })
  }
  getInaciveOfferDocs(){
    this.rest.getInactiveFileListByDealIdAndTypeId({dealID: this.deal.ID, typeID: this.docTypeID}).subscribe({
      next: res => {
        if(res.status===200){
          this.documentService.inactiveDocumentChange.next(res.data);
        }
      },
      error: err => {
        console.log(err)
        this.dialogService.showERRMsgDialog(err)
      }
    })
  }
  getApprovalByDocID(){
    this.rest.getApprovalByDocumetID(this.documentService.activeDocument.ID).subscribe({
      next: res => {
        if (res.status===200){
          this.docApproval=res.data;
        }
      },
      error: err => {
        console.log(err)
      }
    })
  }

  showInactiveDoc(datafile: any){
    this.rest.getFile(datafile.ID).subscribe(res=>{
      let blob:Blob=res as Blob;
      let myBlob= new Blob([blob], {type: 'application/pdf'})
      const newWindow = window.open();
      newWindow.document.write(`<iframe src="${URL.createObjectURL(myBlob)}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    });

  }

  downloadInactiveFile(datafile: any){
    this.rest.getFile(datafile.ID).subscribe(res => {
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = datafile.fileName; // Ovde zadaješ ime
      a.click();

      // Opciono: oslobodi memoriju
      URL.revokeObjectURL(url);
    });
  }

  openApprovalDialog(offerDoc: any) {
    this.rest.getApprovalByDocumetID(offerDoc.ID).subscribe({
      next: res => {
        if(res.status===200){
          this.matDialog.open(ApprovalCardComponent, {
            width: '600px',
            data: res.data
          });
        }
      },
      error: err => {
        console.log(err)
      }
    });
  }

}
