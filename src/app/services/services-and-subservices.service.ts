import { Injectable } from '@angular/core';
import {RestService} from "./rest.service";
import {ServiceModel} from "../models/serviceModel";
import {Subject} from "rxjs";
import {DialogService} from "./dialog.service";
import {SubserviceModel} from "../models/subserviceModel";
import {SubserviceLegalentityModel} from "../models/subserviceLegalentityModel";

@Injectable({
  providedIn: 'root'
})
export class ServicesAndSubservicesService {

  services: ServiceModel[] = [];
  servicesForLe: ServiceModel[] = [];

  subservices: SubserviceModel[] = [];
  subservicesForLe: SubserviceModel[] = [];

  subservicelegalEntity: SubserviceLegalentityModel[] = [];

  constructor(private rest: RestService, private dialogService: DialogService) {
    this.createListOfServices();
    this.createListOfSubervices();
    this.createListOfSubserviceLE();
  }

  createListOfServices(){
    this.rest.getServices().subscribe(res=>{
      if (res.status == 200){
        this.services = [];
        for (let item of res.data) {
          this.services.push(ServiceModel.createServiceModel(item));
        }
      }else if(res.status == 204){
        this.dialogService.showSnackBar('Empty services', '', 3000)
      }else {
        this.dialogService.errorDialog(res)
      }
    });
  }

  public createListOfServicesForLe(leID): Promise<void>{
    return new Promise(resolve => {
      this.rest.getServicesforLe(leID).subscribe(res=>{
        this.servicesForLe = [];
        if (res.status == 200){
          for (let item of res.data) {
            this.servicesForLe.push(ServiceModel.createServiceModel(item));
          }
        }
        resolve();
      });
    })

  }

  createListOfSubervices(){
    this.rest.getSubservices().subscribe(res=>{
      if (res.status == 200){
        this.subservices = [];
        for (let item of res.data) {
          this.subservices.push(SubserviceModel.createSubserviceModel(item));
        }
      }else if(res.status == 204){
        this.dialogService.showSnackBar('Empty subservice', '', 3000)
      }
      else {
        this.dialogService.errorDialog(res)
      }
    });
  }
  createListOfSubervicesForLE(leID, serviceID):Promise<void>{
    return new Promise((resolve, reject) => {
      this.rest.getSubservicesForLe(leID, serviceID).subscribe(res=>{
        if (res.status == 200){
          this.subservicesForLe = [];
          for (let item of res.data) {
            this.subservicesForLe.push(SubserviceModel.createSubserviceModel(item));
          }
        }else if(res.status == 204){
          this.dialogService.showSnackBar('Empty subservice', '', 3000)
        }
        resolve();
      });
    })
  }
  createListOfSubserviceLE(){
    this.rest.getSubservicesLE().subscribe(res=>{
      if (res.status == 200){
        this.subservicelegalEntity = [];
        for (let item of res.data) {
          this.subservicelegalEntity.push(SubserviceLegalentityModel.createSubserviceLegalentityModel(item));
        }
      }else if(res.status == 204){
        this.dialogService.showSnackBar('Empty services', '', 3000)
      }else {
        this.dialogService.errorDialog(res)
      }
    });
  }

  deleteService(id: number) {
    this.dialogService.showLoader()
    this.rest.deleteService(id).subscribe(res=>{
      this.dialogService.closseLoader()
      if (res.status === 201){
        this.services = this.services.filter(obj => obj.ID !== id);
        this.subservices = this.subservices.filter(obj => obj.serviceID !==id);
      }else {
        this.dialogService.errorDialog(res)
      }
    })
  }

  deleteSubservice(id: number) {
    this.dialogService.showLoader()
    this.rest.deleteSubservice(id).subscribe(res=>{
      this.dialogService.closseLoader()
      if (res.status === 201){
        this.subservices = this.subservices.filter(obj => obj.ID !== id);
      }else {
        this.dialogService.errorDialog(res)
      }
    })
  }

  createService(data: any, dialogRef) {
    this.dialogService.showLoader()
    this.rest.createService(data).subscribe(res=>{
      this.dialogService.closseLoader()
      if (res.status === 201){
        this.services.push(ServiceModel.createServiceModel(res.data.row.recordset[0]));
        dialogRef.close(res.status);
      }else {
        this.dialogService.errorDialog(res)
      }
      dialogRef.close(res.status);
    });
  }

  createSubservice(data: any, dialogRef) {
    this.dialogService.showLoader()
    this.rest.createSubservice(data).subscribe(res=>{
      this.dialogService.closseLoader()
      if (res.status === 201){
        this.subservices.push(SubserviceModel.createSubserviceModel(res.data.row.recordset[0]));
        dialogRef.close(res.status);
      }else {
        this.dialogService.errorDialog(res)
      }
      dialogRef.close(res.status);
    });
  }

  editService(serviceObj, dialogRef) {
    this.dialogService.showLoader();
    this.rest.editService(serviceObj).subscribe(res=>{
      this.dialogService.closseLoader();
      if (res.status === 201){
        this.services[this.services.findIndex(service => service.ID === serviceObj.ID)] = serviceObj;
      }else {
        this.dialogService.errorDialog(res)
      }
      dialogRef.close(res.status);
    });
  }

  editSubservice(subserviceObj, dialogRef) {
    this.dialogService.showLoader();
    this.rest.editSubservice(subserviceObj).subscribe(res=>{
      this.dialogService.closseLoader();
      if (res.status === 201){
        this.subservices[this.subservices.findIndex(subservice => subservice.ID === subserviceObj.ID)] = subserviceObj;
      }else {
        this.dialogService.errorDialog(res)
      }
      dialogRef.close(res.status);
    });
  }

  editSubserviceLE(subserviceLeObj, dialogRef) {
    this.dialogService.showLoader();
    this.rest.editSubserviceLe(subserviceLeObj).subscribe(res=>{
      this.dialogService.closseLoader();
      if (res.status === 201){
        this.subservicelegalEntity[this.subservicelegalEntity.findIndex(obj => obj.ID === subserviceLeObj.ID)] = SubserviceLegalentityModel.createSubserviceLegalentityModel(res.data.row.recordset[0]);
      }else {
        this.dialogService.errorDialog(res)
      }
      dialogRef.close(res.status);
    });
  }

  deleteSubserviceLE(id: number) {
    this.dialogService.showLoader()
    this.rest.deleteSubserviceLE(id).subscribe(res=>{
      this.dialogService.closseLoader()
      if (res.status === 201){
        this.subservicelegalEntity = this.subservicelegalEntity.filter(obj => obj.ID !== id);
      }else {
        this.dialogService.errorDialog(res)
      }
    })
  }

  createSubserviceLe(data: any, dialogRef) {
    this.dialogService.showLoader()
    this.rest.createSubserviceLe(data).subscribe(res=>{
      this.dialogService.closseLoader()
      if (res.status === 201){
        this.subservicelegalEntity.push(SubserviceLegalentityModel.createSubserviceLegalentityModel(res.data.row.recordset[0]));
        this.createListOfSubserviceLE();
        dialogRef.close(res.status);
      }else {
        this.dialogService.errorDialog(res);
      }
      dialogRef.close(res.status);
    });
  }

}
