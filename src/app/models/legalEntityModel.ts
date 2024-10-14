import {ErCred} from "./erCred";

export class LegalEntityModel{
  private _id: number;
  private _name: string;
  private _erCred: ErCred;
  private _token: string;
  private _shortName: string;
  private _franchise_fee: number;


  constructor(id: number, name: string, erCred: ErCred, token: string, shortName: string, franchise_fee: number) {
    this._id = id;
    this._name = name;
    this._erCred = erCred;
    this._token = token;
    this._shortName = shortName;
    this._franchise_fee = franchise_fee;
  }


  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get erCred(): ErCred {
    return this._erCred;
  }

  get token(): string {
    return this._token;
  }


  get shortName(): string {
    return this._shortName;
  }

  get franchise_fee(): number {
    return this._franchise_fee;
  }

  public static createLegalEntity(data) {
    let erCredentials = ErCred.createErCredModel({id: data.ercId, username: data.ercUsername, md5pass: data.ercmd5pass});
    return new LegalEntityModel(data.id, data.name, erCredentials, data.token, data.shortName, data.franchise_fee);
  }
}
