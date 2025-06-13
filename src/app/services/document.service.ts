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
  addNewDocument = new Subject<any>();

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
    this.dialogService.showLoader();
    this.rest.lockCDCM(ID, approvalTemplateID, dealID).subscribe({
      next: res => {
        this.dialogService.closeLoader();
        if (res.status===200){
          this.approvalStart.next(dealID);
        }
      },
      error: (err) => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }

    })
  }

}
