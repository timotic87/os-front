export class ErCred {
  private _id: number;
  private _username: string;
  private _md5pass: string;


  constructor(id: number, username: string, md5pass: string) {
    this._id = id;
    this._username = username;
    this._md5pass = md5pass;
  }


  get id(): number {
    return this._id;
  }

  get username(): string {
    return this._username;
  }

  get md5pass(): string {
    return this._md5pass;
  }

  public static createErCredModel(data: any): ErCred{
    return new ErCred(data.id, data.username, data.md5pass);
  }
}
