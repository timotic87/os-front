
export class CurrencyModel {
  private _id: number;
  private _name: string;
  private _nbsCode: number;


  constructor(id: number, name: string, nbsCode: number) {
    this._id = id;
    this._name = name;
    this._nbsCode = nbsCode;
  }
  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get nbsCode(): number {
    return this._nbsCode;
  }

  public static createCurrencyModel(data: any): CurrencyModel{
    return new CurrencyModel(data.id, data.name, data.nbsCode);
  }
}
