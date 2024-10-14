import { UnitModel } from "./unitModel";
import { DepartmentModel } from "./departmentModel";
import { PositionModel } from "./positionModel";
import { UserStatusModel } from "./userStatusModel";
import {LogicalFileSystem} from "@angular/compiler-cli";

export class UserModel {
  private _id: number;
  private _firstName: string;
  private _lastName: string;
  private _fullName: string;
  private _userName: string;
  private _defpage: string;
  private _department: DepartmentModel;
  private _unit: UnitModel;
  private _position: PositionModel;
  private _status: UserStatusModel;
  private _mail: string;
  private _picUrl: string;


  constructor(id: number, firstName: string, lastName: string, userName: string, unit: UnitModel, department: DepartmentModel, posiion: PositionModel, status: UserStatusModel, defpage: string, mail:string, picUrl: string, isFromLocalStorage: boolean) {
    this._id = id;
    this._firstName = firstName;
    this._lastName = lastName;
    this._fullName = firstName+' '+lastName;
    this._userName = userName;
    this._unit = unit;
    this._department = department;
    this._position = posiion;
    this._status = status;
    this._defpage = defpage;
    this._mail = mail;
    if (isFromLocalStorage){
      this._picUrl = picUrl;
    }else {
      this._picUrl = decodeURIComponent(picUrl);
    }

  }

  get id(): number {
    return this._id;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return this._fullName;
  }

  get userName(): string {
    return this._userName;
  }

  get department(): DepartmentModel {
    return this._department;
  }

  get status(): UserStatusModel {
    return this._status;
  }

  get defpage(): string {
    return this._defpage;
  }


  get unit(): UnitModel {
    return this._unit;
  }

  get position(): PositionModel {
    return this._position;
  }

  get mail(): string {
    return this._mail;
  }

  get picUrl(): string {
    return this._picUrl;
  }

  set picUrl(value: string) {
    this._picUrl = value
  }

  public static createUserModel(data: any){
    let unit = UnitModel.createUnitModel({ID: data.unitID, name: data.unitName});
    let departmentModel = DepartmentModel.createDepartmentModel({ID: data.departmentID, name: data.departmentName});
    let positionModel = PositionModel.createPositionModel({ID: data.positionID, name: data.positionName});
    let status = UserStatusModel.createUserStatusModel({id: data.userStatusesId, name: data.statusName});
    return new UserModel(data.id, data.firstName, data.lastName, data.username, unit, departmentModel, positionModel, status, data.defpage, data.mail, data.profilePicUrl, false);
  }

  public static createUserModelDva(data: any){
    let unit = UnitModel.createUnitModel({ID: data.unitID, name: data.unitName});
    let departmentModel = DepartmentModel.createDepartmentModel({ID: data.departmentID, name: data.departmentName});
    let positionModel = PositionModel.createPositionModel({ID: data.positionID, name: data.positionName});
    let status = UserStatusModel.createUserStatusModel({id: data.userStatusesId, name: data.statusName});
    return new UserModel(data.id, data.firstName, data.lastName, data.username, unit, departmentModel, positionModel, status, data.defpage, data.mail, data.profilePicUrl, true);
  }

  public static createUserFromLocalStorage(data: any){
    let unit = UnitModel.createUnitModel({ID: data._unit._id, name: data._unit._name});
    let departmentModel = DepartmentModel.createDepartmentModel({ID: data._department._id, name: data._department._name});
    let positionModel = PositionModel.createPositionModel({ID: data._position._id, name: data._position._name});
    let status = UserStatusModel.createUserStatusModel({id: data._status._id, name: data._status._name});
    return new UserModel(data._id, data._firstName, data._lastName, data._userName, unit, departmentModel, positionModel, status, data._defpage, data._mail, data._picUrl, true);

  }

}
