import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {UnitModel} from "../models/unitModel";

@Injectable({
  providedIn: 'root'
})
export class UnitService {

  constructor() { }

  createUnitList(data: any): any {
    let units: UnitModel[] = [];
    for (let item of data) {
      units.push(UnitModel.createUnitModel(item));
    }
    return units;
  }
}
