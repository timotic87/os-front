import {Component, Input, OnInit} from '@angular/core';
import {SaveDocumetDialogComponent} from "../save-documet-dialog/save-documet-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {NgIf} from "@angular/common";
import {DocumentService} from "../../services/document.service";
import {ApprovalCardComponent} from "../../customComponents/approval-card/approval-card.component";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {DocumentCardComponent} from "../dokument-approval/document-card/document-card.component";
import {InactiveDocumentCardComponent} from "../dokument-contract-approval/inactive-document-card/inactive-document-card.component";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-dokument-regruting-approval',
  standalone: true,
  imports: [
    NgIf,
    ApprovalCardComponent,
    MatMenu,
    MatMenuTrigger,
    DocumentCardComponent,
    InactiveDocumentCardComponent
  ],
  templateUrl: './dokument-regruting-approval.component.html',
  styleUrl: './dokument-regruting-approval.component.css'
})
export class DokumentRegrutingApprovalComponent implements OnInit {

  @Input() deal: any;
  @Input() docTypeID: any;
  @Input() docSubTypeID: any;
  @Input() statusIDShow: any;
  @Input() type: 'offer' | 'contract' = 'offer';
  @Input() approvalID = 2;
  @Input() actionsDisabled: boolean = false; // Disable all actions when deal is not active

  docApproval: any;

  constructor(public matDialog: MatDialog, public rest: RestService, public dialogService: DialogService, public documentService: DocumentService,
              public userService: UserService) {
    documentService.approvalStart.subscribe(approval => {
      // Update document status and get approval data without refresh
      this.updateDocumentStatusAfterSubmit();
    });
    
    documentService.documentDeleted.subscribe(deleted => {
      if (deleted) {
        this.getActiveOffer();
        this.getInaciveOfferDocs();
      }
    });
    
    documentService.approvalRejected.subscribe(rejectionData => {
      // Approval was rejected - refresh document lists
      this.getActiveOffer();
      this.getInaciveOfferDocs();
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

      // Optional: Handle dialog result
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('Document saved successfully');
        }
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
    if (!this.documentService.activeDocument || !this.documentService.activeDocument.ID) {
      this.docApproval = null;
      return;
    }
    
    this.rest.getApprovalByDocumetID(this.documentService.activeDocument.ID).subscribe({
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

  updateDocumentStatusAfterSubmit() {
    // Wait a bit for the backend operation to complete before fetching updated data
    // This prevents race condition where local status change gets overwritten by stale server data
    setTimeout(() => {
      console.log('🔄 DOCUMENT STATUS: Fetching updated document status after delay...');
      this.rest.getActiveFileListByDealIdAndTypeId({dealID: this.deal.ID, typeID: this.docTypeID}).subscribe({
        next: res => {
          if(res.status === 200 && res.data) {
            console.log('🔄 DOCUMENT STATUS: Server response received:', res.data?.status?.name, 'statusID:', res.data?.statusID);
            
            // Only update if the status actually changed to avoid overwriting correct local state
            if (this.documentService.activeDocument && 
                res.data.statusID !== this.documentService.activeDocument.statusID) {
              
              console.log('🔄 DOCUMENT STATUS: Status changed from', 
                         this.documentService.activeDocument.statusID, 'to', res.data.statusID);
              
              // Update active document with new status
              this.documentService.activeDocument = res.data;
              
              // Trigger change detection for document card to update status badge
              this.documentService.activeDocumentChange.next(res.data);
            } else {
              console.log('🔄 DOCUMENT STATUS: No status change detected, keeping current state');
            }
            
            // Get approval data to show approval card
            this.getApprovalByDocID();
            
            // Show success message
            this.dialogService.showSnackBar('Document submitted for approval successfully!', '', 4000);
          }
        },
        error: err => {
          console.log('Error updating document status:', err);
          // Fallback to full refresh if there's an error
          this.getActiveOffer();
        }
      });
    }, 1500); // Give backend time to process the approval start operation
  }

  onApprovalUpdated(event: any): void {
    // Update the local approval object when a step changes
    this.docApproval = event.approval;
    console.log('Regruting approval updated:', event);
  }

  onAllApprovalsCompleted(event: any): void {
    // Handle when all approval steps are completed
    console.log('All regruting approvals completed:', event);
    
    // Refresh the document status as it might have changed
    this.getActiveOffer();
    this.getInaciveOfferDocs();
  }

}
