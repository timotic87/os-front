export class NotificationModel {

  private _firstName: string;
  private _lastName: string;
  private _fullName: string;
  private _creatorId: number;
  private _flagged: boolean;
  private _id: number;
  private _isRead: boolean;
  private _msg: string;
  private _themeId: number;
  private _dateTime: Date;


  constructor(firstName: string, lastName: string, creatorId: number, flagged: boolean, id: number, isRead: boolean, msg: string, themeId: number, dateTime: Date) {
    this._firstName = firstName;
    this._lastName = lastName;
    this._fullName = firstName+' '+lastName;
    this._creatorId = creatorId;
    this._flagged = flagged;
    this._id = id;
    this._isRead = isRead;
    this._msg = msg;
    this._themeId = themeId;
    this._dateTime = new Date(dateTime)
  }


  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return this._fullName;
  }

  get creatorId(): number {
    return this._creatorId;
  }

  get flagged(): boolean {
    return this._flagged;
  }

  get id(): number {
    return this._id;
  }

  get isRead(): boolean {
    return this._isRead;
  }

  get msg(): string {
    return this._msg;
  }

  get themeId(): number {
    return this._themeId;
  }

  get dateTime(): Date {
    return this._dateTime;
  }

  set flagged(value: boolean) {
    this._flagged = value;
  }

  set isRead(value: boolean) {
    this._isRead = value;
  }

  public static notificationCreator(data: any): NotificationModel {
    return new NotificationModel(data.creatorFirstName, data.creatorLastName, data.userId, data.flagged, data.id, data.isRead, data.msg, data.themeId, data.creationDate);
  }
}
