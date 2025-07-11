import { Injectable } from '@angular/core';
import {RestService} from "./rest.service";
import {Subject} from "rxjs";
import {DialogService} from "./dialog.service";
import {MatDialog,} from "@angular/material/dialog";

@Injectable({
  providedIn: 'root'
})
export class CDCMService {

  cdcmList: any[];

  listDPperNumberOfEmployee = null;
  cdcmSeniorityList = null;
  cdcmStaticsList = null;
  seniorityListListener = new Subject<boolean>();

  calculationCDCM = null;

  updateCDCMSubject = new Subject<any>();
  newCDCMSubject = new Subject<any>();
  deleteCDCMSubject = new Subject<number>();
  updateStatusCDCMSubject = new Subject<object>();

  constructor(private rest: RestService, private dialogService: DialogService) {
    this.getFields();
  }

  createlistDPperNumberOfEmployee(){
    this.rest.getDPperNumberOfEmployee().subscribe(res=>{
      if (res.status == 200){
        this.listDPperNumberOfEmployee = [];
        for (let item of res.data) {
          this.listDPperNumberOfEmployee.push(item);
        }
      }else {
        console.log(res)
      }
    });
  }

  createlistcdcmSeniorityList(){
    this.rest.getCDCMSeniority().subscribe(res=>{
      if (res.status == 200){
        this.cdcmSeniorityList = [];
        for (let item of res.data) {
          this.cdcmSeniorityList.push(item);
        }
        this.seniorityListListener.next(true);
      }else {
        this.dialogService.errorDialog(res);
      }
    });
  }

  getSeniorityObjByName(name:string){
    return this.cdcmSeniorityList.find(item => item.name === name);
  }

  createlistcdcmStatics(){
    this.rest.getCDCMStatics().subscribe(res=>{
      if (res.status == 200){
        this.cdcmStaticsList = [];
        for (let item of res.data) {
          this.cdcmStaticsList.push(item);
        }
      }else {
        console.log(res)
      }
    });
  }

  getDisabledPeople(noOfEmployee: number){
    for (let item of this.listDPperNumberOfEmployee) {
      if (noOfEmployee>=item.min && noOfEmployee<=item.max){
        return item.fee
      }
    }
  }

  calculateAndCreateCDCM(formData,dialogRef){
    this.dialogService.showLoader();
    this.rest.createCDCM(formData).subscribe({
      next: res=>{
        this.dialogService.closeLoader();
        if (res.status===200){
          this.newCDCMSubject.next(res.data);
          dialogRef.close()
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        dialogRef.close();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    })
  }

  calculateCDCM(data: any){
    console.log(data)
    this.rest.calculateCDCM(data).subscribe(res=>{
      if (res.status===200){
        this.calculationCDCM = res.data;
      }
    });
  }

  deleteCDCM(ID: number){
    this.dialogService.showLoader();
    this.rest.deleteCDCM(ID).subscribe({
      next: res=>{
        this.dialogService.closeLoader();
        if (res.status===200){
          this.deleteCDCMSubject.next(ID);
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }



    });
  }
  lockCDCM(ID:number, approvalTemplateID:number, dealID: number) {
    this.dialogService.showLoader();
    this.rest.lockCDCM(ID, approvalTemplateID, dealID).subscribe({
      next: res=> {
        this.dialogService.closeLoader();
        if (res.status === 200) {
          this.updateStatusCDCMSubject.next({ID});
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
        }
    });
  }

  updateCDCM(data){
    this.dialogService.showLoader();
    this.rest.updateCDCM(data).subscribe({
      next: res=>{
        this.dialogService.closeLoader();
        if (res.status===200){
          this.updateCDCMSubject.next(res.data);
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    })
  }

  public getFields(){
    this.createlistDPperNumberOfEmployee();
    this.createlistcdcmSeniorityList();
    this.createlistcdcmStatics();
  }




}
