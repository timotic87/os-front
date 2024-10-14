export class ServiceModel {
  private _ID: number;
  private _name: string;


  constructor(ID: number, name: string) {
    this._ID = ID;
    this._name = name;
  }


  get ID(): number {
    return this._ID;
  }

  get name(): string {
    return this._name;
  }

  public static createServiceModel(data: any){
    return new ServiceModel(data.ID, data.name);
  }
}
