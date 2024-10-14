import { Injectable } from '@angular/core';
import {DepartmentModel} from "../models/departmentModel";

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  constructor() { }

  createListOfDepartments(data){
    let departments: DepartmentModel[] = [];
    for (let item of data) {
      departments.push(DepartmentModel.createDepartmentModel(item));
    }
    return departments;
  }
}
