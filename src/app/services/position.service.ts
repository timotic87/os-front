import { Injectable } from '@angular/core';
import {PositionModel} from "../models/positionModel";
import {ProjectModel} from "../models/projectModel";
import {RestService} from "./rest.service";

@Injectable({
  providedIn: 'root'
})
export class PositionService {

  constructor(private rest: RestService) { }

  createPositionList(data: any): PositionModel[] {
    let positions: PositionModel[] = [];
    for (let item of data) {
      positions.push(PositionModel.createPositionModel(item))
    }
    return positions;
  }
}
