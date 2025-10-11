import {Component, Input, OnInit} from '@angular/core';
import {SaveDocumetDialogComponent} from "../save-documet-dialog/save-documet-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {NgIf} from "@angular/common";
import {ApprovalCardComponent} from "../../customComponents/approval-card/approval-card.component";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {DocumentContractCardComponent} from "./document-contract-card/document-contract-card.component";
import {DocumentCardComponent} from "../dokument-approval/document-card/document-card.component";
import {InactiveDocumentCardComponent} from "./inactive-document-card/inactive-document-card.component";
import {UserService} from "../../services/user.service";
import {DocumentService} from "../../services/document.service";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";

@Component({
  selector: 'app-dokument-contract-approval',
  standalone: true,
  imports: [
    NgIf,
    ApprovalCardComponent,
    MatMenu,
    MatMenuTrigger,
    DocumentCardComponent,
    InactiveDocumentCardComponent,
    ButtonComponent
  ],
  templateUrl: './dokument-contract-approval.html',
  styleUrl: './dokument-contract-approval.css'
})
export class DokumentContractApproval implements OnInit {

  @Input() deal: any;
  @Input() docTypeID: any;
  @Input() docSubTypeID: any;
  @Input() statusIDShow: any;
  @Input() type: 'offer' | 'contract' = 'offer';
  @Input() approvalID = 3;
  @Input() actionsDisabled: boolean = false; // Disable all actions when deal is not active

  docApproval: any;
  activeContractDocument: any;
  inactiveContractDocuments: any = [];
  
  private preservedScrollPosition = 0;

  constructor(public matDialog: MatDialog, public rest: RestService, public dialogService: DialogService, private userService: UserService, private documentService: DocumentService) {
    documentService.documentDeleted.subscribe(deleted => {
      if (deleted) {
        this.getActiveContract();
        this.getInaciveOfferDocs();
      }
    });
    
    // Listen for new document addition
    documentService.addNewDocument.subscribe(newDoc => {
      if (newDoc) {
        this.getActiveContract();
        this.getInaciveOfferDocs();
      }
    });
    
    // Listen for approval start to refresh document status
    documentService.approvalStart.subscribe(data => {
      this.getActiveContract();
      this.getInaciveOfferDocs();
    });
    
    // Listen for approval rejection to refresh document lists
    documentService.approvalRejected.subscribe(rejectionData => {
      this.getActiveContract();
      this.getInaciveOfferDocs();
    });
  }

  ngOnInit(): void {
    this.getActiveContract();
    this.getInaciveOfferDocs();

    }


  async openFileExplorer(fileInput: HTMLInputElement) {
    if (!this.userService.can('edit_deal') && !await this.userService.hasEntityAccess('deal', this.deal.ID, 'edit')){
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
        input.value = ''; // Reset input after invalid file
        return;
      }

      const dialogRef = this.matDialog.open(SaveDocumetDialogComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {file: file, deal: this.deal, documetTypeID:this.docTypeID, docSubTypeID:this.docSubTypeID},
      });

      // Reset the input value to allow selecting the same file again
      input.value = '';

      // Handle dialog result
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('Document saved successfully');
        }
      });
    }
  }

  getActiveContract(){
    this.rest.getActiveFileListByDealIdAndTypeId({dealID: this.deal.ID, typeID: this.docTypeID}).subscribe({
      next: res => {
        if(res.status===200){
          this.activeContractDocument=res.data;
          if (this.activeContractDocument) {
            this.getApprovalByDocID();
          } else {
            // Clear approval when no active document
            this.getApprovalByDocID();
          }
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
          this.inactiveContractDocuments = res.data;
        }
      },
      error: err => {
        console.log(err)
        this.dialogService.showERRMsgDialog(err)
      }
    })
  }
  getApprovalByDocID(){
    if (!this.activeContractDocument || !this.activeContractDocument.ID) {
      this.docApproval = null;
      return;
    }
    
    this.rest.getApprovalByDocumetID(this.activeContractDocument.ID).subscribe({
      next: res => {
        if (res.status===200){
          this.docApproval=res.data;
        }
      },
      error: err => {
        console.log(err)
        this.docApproval = null;
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

  onApprovalUpdated(event: any): void {
    // Update the local approval object when a step changes
    this.docApproval = event.approval;
    console.log('Contract approval updated:', event);
  }

  onAllApprovalsCompleted(event: any): void {
    // Handle when all approval steps are completed
    console.log('All contract approvals completed:', event);
    
    // Refresh the document status as it might have changed
    this.getActiveContract();
    this.getInaciveOfferDocs();
  }

}
