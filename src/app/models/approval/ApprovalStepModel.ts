import {ApprovalStatus} from "./approvalStatus";
import {Subject} from "rxjs";

export class ApprovalStepModel {

  private _ID: number;
  private _approvalID: number;
  private _userID: number;
  private _firstName: string;
  private _lastName: string;
  private _stepOrder: number;
  private _approvalStatus: ApprovalStatus;
  private _statusChangeDate: Date;
  private _userPicUrl: string;
  private _comment: string;

  changeStatusSubject: Subject<ApprovalStatus>;

  constructor(ID: number, approvalID: number, userID: number, firstName: string, lastName: string, stepOrder: number,
              approvalStatus: ApprovalStatus, statusChangeDate: string, userPicUrl: string, comment: string) {
    this._ID = ID;
    this._approvalID = approvalID;
    this._userID = userID;
    this._firstName = firstName;
    this._lastName = lastName;
    this._approvalStatus = approvalStatus;
    this._stepOrder = stepOrder;
    this._statusChangeDate=new Date(statusChangeDate);
    this._userPicUrl=userPicUrl;
    this._comment = comment;
  }

  get ID(): number {
    return this._ID;
  }

  get approvalID(): number {
    return this._approvalID;
  }

  get userID(): number {
    return this._userID;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get approvalStatus(): ApprovalStatus {
    return this._approvalStatus;
  }


  get stepOrder(): number {
    return this._stepOrder;
  }

  get statusChangeDate(): Date {
    return this._statusChangeDate;
  }

  get userPicUrl(): string {
    return this._userPicUrl;
  }

  get comment(): string {
    return this._comment;
  }

changeStatus(approvalStatus: ApprovalStatus) {
    this._approvalStatus = approvalStatus;
  }
}
