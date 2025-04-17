import { Injectable } from '@angular/core';
import {RestService} from "./rest.service";
import {Subject} from "rxjs";
import {DialogService} from "./dialog.service";
import {MatDialog,} from "@angular/material/dialog";
import {CDCM} from "../models/cdcm";

@Injectable({
  providedIn: 'root'
})
export class CDCMService {

  cdcmList: CDCM[];

  listDPperNumberOfEmployee = null;
  cdcmSeniorityList = null;
  cdcmStaticsList = null;
  seniorityListListener = new Subject<boolean>();

  calculationCDCM = null;

  updateCDCMSubject = new Subject<CDCM>();
  newCDCMSubject = new Subject<CDCM>();
  deleteCDCMSubject = new Subject<number>();
  updateStatusCDCMSubject = new Subject<object>();
  // getCDCMListSubject = new Subject<any>();

  constructor(private rest: RestService, private dialogService: DialogService, private matDialog: MatDialog) {

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
        console.log(res)
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
    this.rest.createCDCM(formData).subscribe(res=>{
      if (res['status']===201){
        this.newCDCMSubject.next(CDCM.createCDCMModel(res['data'].row.recordset[0]));
        dialogRef.close()
      }
    })
  }

  calculateCDCM(data: any){
    this.rest.calculateCDCM(data).subscribe(res=>{
      if (res['status']===200){
        this.calculationCDCM = res['data'];
      }
    });
  }

  updateCDCM(data: any){
    this.dialogService.showLoader();
      this.rest.updateCDCM(data).subscribe({
        next: res => {
          if (res.status!==200){
            this.dialogService.errorDialog(res)
          }else {
            let updatedCDCM = CDCM.createCDCMModel(res.data[0])
            console.log(updatedCDCM)
            this.updateCDCMSubject.next(updatedCDCM);
            this.cdcmList[0] = updatedCDCM;
          }
          this.dialogService.closeLoader()
          this.matDialog.closeAll()
        },
        error: err => {
          console.log(err);
          this.dialogService.closeLoader()
          this.matDialog.closeAll()
        }
      });
  }

  deleteCDCM(ID: number){
    this.rest.deleteCDCM(ID).subscribe(res=>{
      if (res.status===201){
        this.deleteCDCMSubject.next(ID);
      }
    });
  }
  lockCDCM(ID:number, approvalTemplateID:number, projectID: number) {
    this.rest.lockCDCM(ID, approvalTemplateID, projectID).subscribe(res=>{
      if (res.status===201){
        this.updateStatusCDCMSubject.next({ID, ...res.data.row.recordset[0]});
      }
    })
  }
//todo promena na deal
  // getCDCMLIstByProjectId(projectId: number){
  //   this.cdcmList = [];
  //   this.rest.getCdcmByProjectID(projectId).subscribe(res=>{
  //     if (res.status===200){
  //       for (let item of res.data) {
  //         this.cdcmList.push(CDCM.createCDCMModel(item));
  //       }
  //       this.getCDCMListSubject.next(this.cdcmList);
  //     }
  //   })
  // }

  public getFields(){
    this.createlistDPperNumberOfEmployee();
    this.createlistcdcmSeniorityList();
    this.createlistcdcmStatics();
  }




}
