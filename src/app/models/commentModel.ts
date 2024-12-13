export class CommentModel {
  private _firstName: string;
  private _lastName: string;
  private _datetime: Date;
  private _userPicUrl: string;
  private _comment: string;
  private _fullName: string;


  constructor(firstName: string, lastName: string, datetime: string, userPicUrl: string, comment: string) {
    this._firstName = firstName;
    this._lastName = lastName;
    let tmpTime = new Date(datetime);
    tmpTime.setHours(tmpTime.getHours()-1);
    this._datetime = tmpTime;
    this._userPicUrl = userPicUrl;
    this._comment = comment;
    this._fullName = firstName+' '+ lastName;
  }


  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get datetime(): Date {
    return this._datetime;
  }

  get userPicUrl(): string {
    return this._userPicUrl;
  }

  get comment(): string {
    return this._comment;
  }

  get fullName(): string {
    return this._fullName;
  }
}
