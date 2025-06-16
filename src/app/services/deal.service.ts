import { Injectable } from '@angular/core';
import {RestService} from "./rest.service";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DealService {

  constructor(private rest: RestService) { }


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
