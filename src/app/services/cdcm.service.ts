import { Injectable } from '@angular/core';
import {RestService} from "./rest.service";
import {ServiceModel} from "../models/serviceModel";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class CDCMService {

  listDPperNumberOfEmployee = null;
  cdcmSeniorityList = null;
  cdcmStaticsList = null;
  seniorityListListener = new Subject<boolean>();

  calculationCDCM = null;

  constructor(private rest: RestService) {
    this.createlistDPperNumberOfEmployee();
    this.createlistcdcmSeniorityList();
    this.createlistcdcmStatics();
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
    console.log(this.cdcmSeniorityList)
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

  calculateBasicInfo(formData){
    this.rest.calculateBasicInfo(formData).subscribe(res=>{
      console.log(res)
     // @ts-ignore
      if (res.status===200){
       // @ts-ignore
        this.calculationCDCM = res.data;
     }
    });
  }

  calculateAndCreateCDCM(formData,dialogRef){
    this.rest.createCDCM(formData).subscribe(res=>{
      console.log(res)
      if (res['status']===201){

        // this.calculationCDCM = res['data'].row.calculation;
        dialogRef.close()
      }
    })
  }

  calculateCDCM(data){
    this.rest.calculateCDCM(data).subscribe(res=>{
      console.log(res)
      // @ts-ignore
      if (res.status===200){
        // @ts-ignore
        this.calculationCDCM = res.data;
        console.log(this.calculationCDCM)
      }
    });
  }
}
