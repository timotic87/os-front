import { Component } from '@angular/core';
import {ServicesAndSubservicesService} from "../../../services/services-and-subservices.service";
import {MatDialog} from "@angular/material/dialog";
import {AddServicesComponent} from "./dialogs/add-services/add-services.component";
import {EditServiceComponent} from "./dialogs/edit-service/edit-service.component";
import {AddSubserviceComponent} from "./dialogs/add-subservice/add-subservice.component";
import {EditSubserviceComponent} from "./dialogs/edit-subservice/edit-subservice.component";
import {AddSubserviceLeComponent} from "./dialogs/add-subservice-le/add-subservice-le.component";
import {EditSubserviceLeComponent} from "./dialogs/edit-subservice-le/edit-subservice-le.component";
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent} from '../../../shared/components/ui/card/card.component';

@Component({
  selector: 'app-services-and-subservices',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent
  ],
  templateUrl: './services-and-subservices.component.html',
  styleUrl: './services-and-subservices.component.css'
})
export class ServicesAndSubservicesComponent {

  selectedService: any = null;

  get filteredSubservices() {
    if (!this.selectedService) return [];
    return this.SANDS.subservices.filter(s => s.serviceID === this.selectedService.ID);
  }

  get filteredConnections() {
    if (!this.selectedService) return [];
    return this.SANDS.subservicelegalEntity.filter(c => c.serviceID === this.selectedService.ID);
  }

  constructor(public SANDS: ServicesAndSubservicesService, private matDialog: MatDialog) {
  }

  selectService(service: any) {
    this.selectedService = this.selectedService?.ID === service.ID ? null : service;
  }

  deleteService(service) {
    this.SANDS.deleteService(service.ID);
    if (this.selectedService?.ID === service.ID) {
      this.selectedService = null;
    }
  }

  changeService(service) {
    this.matDialog.open(EditServiceComponent, {
      width: '600px',
      data: service
    });
  }

  addService() {
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

  deleteSubservice(subservice) {
    this.SANDS.deleteSubservice(subservice.ID);
  }

  addSubservice() {
    this.matDialog.open(AddSubserviceComponent, {
      width: '600px'
    });
  }

  changeConnection(connectionObj) {
    this.matDialog.open(EditSubserviceLeComponent, {
      width: '600px',
      data: connectionObj
    });
  }

  deleteConnection(connectionObj) {
    this.SANDS.deleteSubserviceLE(connectionObj.ID);
  }

  addConnection() {
    this.matDialog.open(AddSubserviceLeComponent, {
      width: '600px'
    });
  }

}
