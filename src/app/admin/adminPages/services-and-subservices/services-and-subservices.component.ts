import { Component, OnInit } from '@angular/core';
import {ServicesAndSubservicesService} from "../../../services/services-and-subservices.service";
import {MatDialog} from "@angular/material/dialog";
import {AddServicesComponent} from "./dialogs/add-services/add-services.component";
import {EditServiceComponent} from "./dialogs/edit-service/edit-service.component";
import {AddSubserviceComponent} from "./dialogs/add-subservice/add-subservice.component";
import {EditSubserviceComponent} from "./dialogs/edit-subservice/edit-subservice.component";
import {AddSubserviceLeComponent} from "./dialogs/add-subservice-le/add-subservice-le.component";
import {EditSubserviceLeComponent} from "./dialogs/edit-subservice-le/edit-subservice-le.component";
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent} from '../../../shared/components/ui/card/card.component';
import {RestService} from '../../../services/rest.service';

@Component({
  selector: 'app-services-and-subservices',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent
  ],
  templateUrl: './services-and-subservices.component.html',
  styleUrl: './services-and-subservices.component.css'
})
export class ServicesAndSubservicesComponent implements OnInit {

  selectedService: any = null;

  get filteredSubservices() {
    if (!this.selectedService) return [];
    return this.SANDS.subservices.filter(s => s.serviceID === this.selectedService.ID);
  }

  get filteredConnections() {
    if (!this.selectedService) return [];
    return this.SANDS.subservicelegalEntity.filter(c => c.serviceID === this.selectedService.ID);
  }

  customFlows: any[] = [];

  constructor(public SANDS: ServicesAndSubservicesService, private matDialog: MatDialog, private rest: RestService) {
  }

  ngOnInit() {
    this.SANDS.ensureLoaded();
    this.rest.getFlows().subscribe(res => {
      if (res.status === 200) {
        this.customFlows = res.data;
      }
    });
  }

  getFlowName(subservice: any): string {
    if (subservice.flowID) {
      const custom = this.customFlows.find(f => f.ID === subservice.flowID);
      return custom ? custom.name : `Flow #${subservice.flowID}`;
    }
    const typeID = subservice.typeID;
    if (!typeID) return '-';
    if (typeID === 1) return 'REG';
    if (typeID === 2) return 'STAFFING';
    if (typeID === 3) return 'HRA & PY';
    return '-';
  }

  getFlowBadgeClass(subservice: any): string {
    if (subservice.flowID) return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    const typeID = subservice.typeID;
    if (!typeID) return '';
    if (typeID === 1) return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    if (typeID === 2) return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (typeID === 3) return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    return '';
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
