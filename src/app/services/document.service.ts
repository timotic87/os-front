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
    
    // Set loading state for the document to disable buttons and show loading
    if (this.activeDocument && this.activeDocument.ID === ID) {
      this.activeDocument.isSubmitting = true;
      this.activeDocumentChange.next(this.activeDocument);
    }
    
    this.dialogService.showLoader();
    
    this.rest.lockCDCM(ID, approvalTemplateID, dealID).subscribe({
      next: res => {
        this.dialogService.closeLoader();
        
        if (res.status===200){
          
          // Clear loading state
          if (this.activeDocument && this.activeDocument.ID === ID) {
            this.activeDocument.isSubmitting = false;
            this.activeDocumentChange.next(this.activeDocument);
          }
          
          // Backend should have updated the document status - trigger refresh to get updated data
          
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
          this.activeDocument.isSubmitting = false;
          this.activeDocumentChange.next(this.activeDocument);
        }
        
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    })
  }

}
