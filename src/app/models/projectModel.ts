import {LegalEntityModel} from "./legalEntityModel";
import {ClientModel} from "./clientModel";
import {ServiceModel} from "./serviceModel";
import {SubserviceModel} from "./subserviceModel";
import {UserModel} from "./userModel";
import {ErCred} from "./erCred";
import {CountryModel} from "./countryModel";
import {CurrencyModel} from "./currencyModel";

export class ProjectModel {
  private _ID: number;
  private _legalEntity: LegalEntityModel;
  private _client: ClientModel;
  private _service: ServiceModel;
  private _subservice: SubserviceModel;
  private _creatorUser: UserModel;
  private _bdUser: UserModel;
  private _createdDate: Date;
  private _description: string;
  private _statusID: number;
  private _statusName: string;
  private _lastComment: Comment

  private _comments: Comment[]


  constructor(ID: number, legalEntity: LegalEntityModel, client: ClientModel, service: ServiceModel, subservice: SubserviceModel,
              creatorUser: UserModel, bdUser: UserModel, createdDate: string, description: string, statusID: number, statusName: string, lastComment: Comment) {
    this._ID = ID;
    this._legalEntity = legalEntity;
    this._client = client;
    this._service = service;
    this._subservice = subservice;
    this._creatorUser = creatorUser;
    this._bdUser = bdUser;
    this._createdDate = new Date(createdDate);
    this._description = description;
    this._statusID = statusID;
    this._statusName = statusName;
    this._lastComment = lastComment;
    if (lastComment.comment===null) this._lastComment=null;

  }


  get ID(): number {
    return this._ID;
  }

  get legalEntity(): LegalEntityModel {
    return this._legalEntity;
  }

  get client(): ClientModel {
    return this._client;
  }

  get service(): ServiceModel {
    return this._service;
  }

  get subservice(): SubserviceModel {
    return this._subservice;
  }

  get creatorUser(): UserModel {
    return this._creatorUser;
  }

  get bdUser(): UserModel {
    return this._bdUser;
  }

  get createdDate(): Date {
    return this._createdDate;
  }

  get description(): string {
    return this._description;
  }

  get statusID(): number {
    return this._statusID;
  }

  get statusName(): string {
    return this._statusName;
  }

  get lastComment(): Comment {
    return this._lastComment;
  }


  get comments(): Comment[] {
    return this._comments;
  }

  set comments(value: Comment[]) {
    this._comments = value;
  }

  public static createProjectModel(data: any){
    const erc = new ErCred(data.ercID, data.ercUserName, data.ercMDPASS)
    const le = new LegalEntityModel(data.legalEntityID, data.leName, erc, data.leToken, data.leShortName, data.franchise_fee)
    const country = new CountryModel(data.countryID, data.countryName);
    const currencyClient = new CurrencyModel(data.currencyId, data.currencyName, data.nbsCode);
    const client = new ClientModel(data.clientID, data.clientName, data.clientAddress,
      data.clientCity, country, data.clientPib, data.clientMb, data.clientZipCode, data.clientMail, currencyClient)
    const service = new ServiceModel(data.serviceID, data.serviceName)
    const subservice = new SubserviceModel(data.subserviceID, data.subserviceName, data.serviceID, data.serviceName, data.subserviceTypeID)
    const creatorUser = UserModel.createUserModelDva({unitID: data.CUnitID, unitName: data.cUnitName, departmentID: data.cDepartmentID, departmentName: data.cDepartmentName,
      positionID: data.cPositionID, positionName: data.cPositionName, userStatusesId: data.cUserStatusesId, statusName: data.cStatusName, id: data.creatorID,
      firstName: data.cFirstName, lastName: data.cLastName, username: data.cUsername, defpage: data.cDefpage, mail: data.cMail, profilePicUrl: data.cProfilePicUrl});

    const bdUser = UserModel.createUserModelDva({unitID: data.bdUnitID, unitName: data.bdUnitName, departmentID: data.bdDepartmentID, departmentName: data.bdDepartmentName,
      positionID: data.bdPositionID, positionName: data.bdPositionName, userStatusesId: data.bdUserStatusesId, statusName: data.bdStatusName, id: data.BDOwnerID,
      firstName: data.bdFirstName, lastName: data.bdLastName, username: data.bdUsername, defpage: data.bdDefpage, mail: data.bdMail, profilePicUrl: data.bdProfilePicUrl})

    return new ProjectModel(data.ID, le, client, service, subservice, creatorUser, bdUser, data.createdDate, data.description, data.statusID, data.statusName,
      new Comment(data.lastComment, new Date(data.commentDate),data.commentUserFirstname, data.commentUserLastname, data.commentUserPicUrl, data.commentStatusID));
  }
}

export class Comment {
  private _comment: string;
  private _createdDate: Date;
  private _userName: string;
  private _picUrl: string;
  private _statusID: number;


  constructor(comment: string, createdDate: Date, firstname: string, lastname: string, picUrl: string, statusID: number) {
    this._comment = comment;
    this._createdDate = createdDate;
    this._userName = firstname+' '+lastname;
    this._picUrl = picUrl;
    this._statusID = statusID;
  }


  get comment(): string {
    return this._comment;
  }

  get createdDate(): Date {
    return this._createdDate;
  }

  get userName(): string {
    return this._userName;
  }

  get picUrl(): string {
    return this._picUrl;
  }

  get statusID(): number {
    return this._statusID;
  }

  public static createCommnetArr(data){
    let arr:Comment[] = [];
    for(let item of data){
      let createdDate = new Date(item.createdDate);
      createdDate.setHours(createdDate.getHours()-2);
      arr.push(new Comment(item.comment, createdDate,item.commentUserFirstname, item.commentUserLastname, item.commentUserPicUrl, item.statusID));
    }
    return arr;
}
}
