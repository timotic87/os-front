import { Injectable } from '@angular/core';
import {RestService} from "./rest.service";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DealService {

  constructor(private rest: RestService) { }


  getDealStats(): Observable<{ data: { total: number, active: number, pending: number, completed: number, cancelled: number } }> {
    return this.rest.getDealStats();
  }

  getDealsFiltered(data: {
    offset: number,
    rowsNum: number,
    statusId?: number,
    flowStatusId?: number,
    legalEntityId?: number,
    serviceId?: number,
    subserviceId?: number,
    clientName?: string
  }): Observable<{ data: any[], totalCount: number }> {
    return this.rest.getDealsFiltered(data);
  }

}
