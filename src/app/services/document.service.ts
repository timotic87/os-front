import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {RestService} from "./rest.service";
import {DialogService} from "./dialog.service";

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  activeDocument: any;
  inactiveDocuments: any = [];

  activeDocumentChange = new Subject<any>();
  inactiveDocumentChange = new Subject<any>();
  approvalStart = new Subject<any>();
  approvalRejected = new Subject<any>();
  approvalCompleted = new Subject<any>();
  addNewDocument = new Subject<any>();
  documentDeleted = new Subject<boolean>();
  documentSubmitted = new Subject<any>();

  constructor(private rest: RestService, private dialogService: DialogService) {
    this.activeDocumentChange.subscribe(activeDoc =>{
      if (activeDoc) {
        this.activeDocument = activeDoc;
      }else {
        this.activeDocument = null;
      }
    });
    this.inactiveDocumentChange.subscribe(list=>{
      this.inactiveDocuments = list
    });
  }

  startApproval(ID:number, approvalTemplateID:number, dealID: number) {
    console.log('📤 DOCUMENT SUBMIT: Starting approval for document ID:', ID, 'templateID:', approvalTemplateID, 'dealID:', dealID);
    console.log('📤 DOCUMENT SUBMIT: Current document status before submit:', this.activeDocument?.statusID, this.activeDocument?.status?.name);
    
    // Set loading state for the document to disable buttons and show loading
    if (this.activeDocument && this.activeDocument.ID === ID) {
      console.log('📤 DOCUMENT SUBMIT: Setting document to loading state');
      this.activeDocument.isSubmitting = true;
      this.activeDocumentChange.next(this.activeDocument);
    }
    
    this.dialogService.showLoader();
    
    this.rest.lockCDCM(ID, approvalTemplateID, dealID).subscribe({
      next: res => {
        this.dialogService.closeLoader();
        console.log('📤 DOCUMENT SUBMIT: Full server response:', res);
        
        if (res.status===200){
          console.log('📤 DOCUMENT SUBMIT: Server approval started successfully');
          
          // Clear loading state
          if (this.activeDocument && this.activeDocument.ID === ID) {
            this.activeDocument.isSubmitting = false;
            this.activeDocumentChange.next(this.activeDocument);
          }
          
          // Backend should have updated the document status - trigger refresh to get updated data
          console.log('📤 DOCUMENT SUBMIT: Backend should have updated document status to 2. Triggering refresh...');
          
          // Emit events to trigger UI updates and refresh document lists
          this.approvalStart.next(dealID);
          this.documentSubmitted.next({ documentID: ID, dealID: dealID });
        } else {
          console.error('📤 DOCUMENT SUBMIT: Unexpected server response status:', res.status);
        }
      },
      error: (err) => {
        this.dialogService.closeLoader();
        console.error('📤 DOCUMENT SUBMIT: Error during approval start:', err);
        console.error('📤 DOCUMENT SUBMIT: Error details:', err.error);
        
        // Clear loading state on error
        if (this.activeDocument && this.activeDocument.ID === ID) {
          console.log('📤 DOCUMENT SUBMIT: Clearing loading state due to error');
          this.activeDocument.isSubmitting = false;
          this.activeDocumentChange.next(this.activeDocument);
        }
        
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    })
  }

}
