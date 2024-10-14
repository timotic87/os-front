export class PositionModel {
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
  public static createPositionModel(data: any) :PositionModel{
    return new PositionModel(data.ID, data.name);
  }
}
