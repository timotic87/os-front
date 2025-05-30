import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {RestService} from "./rest.service";

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

  constructor(private rest: RestService) {
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
    this.rest.lockCDCM(ID, approvalTemplateID, dealID).subscribe(res=>{
      if (res.status===200){
        this.approvalStart.next(dealID);

      }
    })
  }

}
