
export class CountryModel {
  private _id: number;
  private _name: string;


  constructor(id: number, name: string) {
    this._id = id;
    this._name = name;
  }
  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  public static createCountryModel(data: any): CountryModel{
    return new CountryModel(data.id, data.name);
  }
}
