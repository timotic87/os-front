export class SubserviceModel {
  private _ID: number;
  private _name: string;
  private _serviceID: number;
  private _serviceName: string;
  private _typeID: number;
  private _flowID: number;


  constructor(ID: number, name: string, serviceID: number, serviceName: string, typeID: number, flowID: number = null) {
    this._ID = ID;
    this._name = name;
    this._serviceID = serviceID;
    this._serviceName = serviceName;
    this._typeID = typeID;
    this._flowID = flowID;
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

  get flowID(): number {
    return this._flowID;
  }

  public static createSubserviceModel(data: any){
    return new SubserviceModel(data.ID, data.name, data.serviceID, data.serviceName, data.typeID, data.flowID);
  }
}
