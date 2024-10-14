import { Component } from '@angular/core';
import {ServicesAndSubservicesService} from "../../../services/services-and-subservices.service";
import {MatDialog} from "@angular/material/dialog";
import {AddServicesComponent} from "./dialogs/add-services/add-services.component";
import {EditServiceComponent} from "./dialogs/edit-service/edit-service.component";
import {AddSubserviceComponent} from "./dialogs/add-subservice/add-subservice.component";
import {EditSubserviceComponent} from "./dialogs/edit-subservice/edit-subservice.component";
import {AddSubserviceLeComponent} from "./dialogs/add-subservice-le/add-subservice-le.component";
import {EditSubserviceLeComponent} from "./dialogs/edit-subservice-le/edit-subservice-le.component";

@Component({
  selector: 'app-services-and-subservices',
  standalone: true,
  imports: [],
  templateUrl: './services-and-subservices.component.html',
  styleUrl: './services-and-subservices.component.css'
})
export class ServicesAndSubservicesComponent {

  constructor(public SANDS: ServicesAndSubservicesService, private matDialog: MatDialog) {

  }

  deleteService(service){
    this.SANDS.deleteService(service.ID);
  }

  changeService(service){
    this.matDialog.open(EditServiceComponent, {
      width: '600px',
      data: service
    });
  }

  addService(){
    this.matDialog.open(AddServicesComponent, {
      width: '600px'
    });
  }

  changeSubservice(subservice) {
    this.matDialog.open(EditSubserviceComponent, {
      width: '600px',
      data: subservice
    });
  }

  deleteSubservice(subservice){
    this.SANDS.deleteSubservice(subservice.ID);
  }

  addSubservice(){
    this.matDialog.open(AddSubserviceComponent, {
      width: '600px'
    });
  }

  changeConnection(connectionObj){
    this.matDialog.open(EditSubserviceLeComponent, {
      width: '600px',
      data: connectionObj
    });
  }

  deleteConnection(connectionObj){
    this.SANDS.deleteSubserviceLE(connectionObj.ID);
  }

  addConnection(){
    this.matDialog.open(AddSubserviceLeComponent, {
      width: '600px'
    });
  }

}
