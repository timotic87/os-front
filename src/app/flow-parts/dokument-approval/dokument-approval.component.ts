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
import {UserService} from "../../services/user.service";

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

  constructor(public matDialog: MatDialog, public rest: RestService, public dialogService: DialogService, public documentService: DocumentService,
              public userService: UserService) {
    documentService.approvalStart.subscribe(approval => {
      this.getApprovalByDocID();
    });

  }

  ngOnInit(): void {
    this.getActiveOffer();
    this.getInaciveOfferDocs();

    }


  async openFileExplorer(fileInput: HTMLInputElement) {

    if (!this.userService.can('edit_deal') && !await this.userService.hasEntityAccess('deal', this.deal.ID, 'edit')) {
      this.dialogService.showMsgDialog("You don't have the right to change deals.");
      return
    }

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
    window.open(`/documentview/${datafile.ID}`, '_blank');
   }

  downloadInactiveFile(datafile: any){
    this.rest.downloadFile(datafile.ID).subscribe(res => {
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
