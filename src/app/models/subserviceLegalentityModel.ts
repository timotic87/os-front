export class SubserviceLegalentityModel {
  private _ID: number;
  private _subserviceID: number;
  private _subserviceName: string;
  private _legalentityName: string;
  private _legalentityShortName: string;
  private _legalentityID: number;
  private _serviceID: number;
  private _serviceName: string;


  constructor(ID: number, subserviceID: number, subserviceName: string, legalentityName: string, legalentityID: number, serviceID: number, serviceName: string, legalentityShortName: string) {
    this._ID = ID;
    this._subserviceID = subserviceID;
    this._subserviceName = subserviceName;
    this._legalentityName = legalentityName;
    this._legalentityID = legalentityID;
    this._serviceID = serviceID;
    this._serviceName = serviceName;
    this._legalentityShortName = legalentityShortName;
  }


  get ID(): number {
    return this._ID;
  }

  get subserviceID(): number {
    return this._subserviceID;
  }

  get subserviceName(): string {
    return this._subserviceName;
  }

  get legalentityName(): string {
    return this._legalentityName;
  }

  get legalentityID(): number {
    return this._legalentityID;
  }

  get serviceID(): number {
    return this._serviceID;
  }

  get serviceName(): string {
    return this._serviceName;
  }

  get legalentityShortName(): string {
    return this._legalentityShortName;
  }

  public static createSubserviceLegalentityModel(data: any){
    return new SubserviceLegalentityModel(data.ID, data.subserviceID, data.subserviceName, data.LEName, data.legalEntityID, data.serviceID, data.servicesName, data.leShortName);
  }
}
