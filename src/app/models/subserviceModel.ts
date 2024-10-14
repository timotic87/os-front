export class SubserviceModel {
  private _ID: number;
  private _name: string;
  private _serviceID: number;
  private _serviceName: string;
  private _typeID: number;


  constructor(ID: number, name: string, serviceID: number, serviceName: string, typeID: number) {
    this._ID = ID;
    this._name = name;
    this._serviceID = serviceID;
    this._serviceName = serviceName;
    this._typeID = typeID;
  }

  get ID(): number {
    return this._ID;
  }

  get name(): string {
    return this._name;
  }

  get serviceID(): number {
    return this._serviceID;
  }

  get serviceName(): string {
    return this._serviceName;
  }

  get typeID(): number {
    return this._typeID;
  }

  public static createSubserviceModel(data: any){
    return new SubserviceModel(data.ID, data.name, data.serviceID, data.serviceName, data.typeID);
  }
}
