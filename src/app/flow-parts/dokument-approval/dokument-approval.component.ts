import {Component, Input, OnInit} from '@angular/core';
import {SaveDocumetDialogComponent} from "../save-documet-dialog/save-documet-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {NgIf} from "@angular/common";
import {DocumentService} from "../../services/document.service";
import {ApprovalCardComponent} from "../../customComponents/approval-card/approval-card.component";
import {MatMenu, MatMenuTrigger} from "@angular/material/menu";
import {DocumentCardComponent} from "./document-card/document-card.component";
import {InactiveDocumentCardComponent} from "../dokument-contract-approval/inactive-document-card/inactive-document-card.component";
import {UserService} from "../../services/user.service";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";

@Component({
  selector: 'app-dokument-approval',
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
  @Input() showApproval: boolean = true;

  /**
   * Check if user can add a new document based on current flow status
   * For offer documents (type 1): allow only during flowStatus 1-6
   * For contract documents (type 2): allow only during flowStatus 9-11
   */
  canAddNewDocument(): boolean {
    const flowStatusID = this.deal?.flowStatus?.ID || 0;

    if (this.docTypeID === 1) {
      return flowStatusID >= 1 && flowStatusID <= 6;
    } else if (this.docTypeID === 2) {
      return flowStatusID >= 9 && flowStatusID <= 11;
    }

    return false;
  }

  docApproval: any;
  
  private preservedScrollPosition = 0;

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
    
    documentService.addNewDocument.subscribe(newDoc => {
      if (newDoc) {
        this.getActiveOffer();
        this.getInaciveOfferDocs();
      }
    });
    
    documentService.approvalRejected.subscribe(rejectionData => {
      // Approval was rejected - refresh document lists to reflect status changes
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

      // Save current scroll position
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
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
          // Restore scroll position
          window.scrollTo({
            top: currentScrollPosition,
            behavior: 'instant'
          });
          
          // Fallback method
          document.documentElement.scrollTop = currentScrollPosition;
          document.body.scrollTop = currentScrollPosition;
          
          // Double-check position after delay
          setTimeout(() => {
            const newPosition = window.pageYOffset || document.documentElement.scrollTop;
            if (newPosition !== currentScrollPosition) {
              window.scrollTo({
                top: currentScrollPosition,
                behavior: 'instant'
              });
              document.documentElement.scrollTop = currentScrollPosition;
              document.body.scrollTop = currentScrollPosition;
            }
          }, 100);
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
    // Wait a shorter time for the backend operation to complete before fetching updated data
    setTimeout(() => {
      this.rest.getActiveFileListByDealIdAndTypeId({dealID: this.deal.ID, typeID: this.docTypeID}).subscribe({
        next: res => {
          if(res.status === 200) {
            if (res.data) {
              // Update active document with fresh data from backend
              this.documentService.activeDocument = res.data;
              
              // Always trigger change detection to update UI components
              this.documentService.activeDocumentChange.next(res.data);
              
              // Get approval data to show approval card
              this.getApprovalByDocID();
              
              // Show success message only if status actually updated to 2
              if (res.data.statusID === 2) {
                this.dialogService.showSnackBar('Document submitted for approval successfully!', '', 4000);
              } else {
                this.dialogService.showSnackBar('Document submitted, but status may not have updated correctly. Please check.', '', 6000);
              }
            }
          }
        },
        error: err => {
          // Fallback to full refresh if there's an error
          this.getActiveOffer();
        }
      });
    }, 800); // Reduced wait time for faster UI feedback
  }

  onApprovalUpdated(event: any): void {
    // Update the local approval object when a step changes
    this.docApproval = event.approval;
  }

  onAllApprovalsCompleted(event: any): void {
    // Handle when all approval steps are completed
    // Refresh the document status as it might have changed
    this.getActiveOffer();
    this.getInaciveOfferDocs();
  }

}
