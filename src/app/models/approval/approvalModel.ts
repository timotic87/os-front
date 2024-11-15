import {ApprovalStepModel} from "./ApprovalStepModel";
import {ApprovalStatus} from "./approvalStatus";

export class ApprovalModel {
  private _approvalID: number;
  private _cdcmId: number;
  private _documentID: number;
  private _createdDate: Date;
  private _isSequential: boolean;
  private _approvalStatus: ApprovalStatus
  private _approvalSeps: ApprovalStepModel[];

  constructor(approvalID: number, cdcmId: number, documentID: number, createdDate: Date, isSequential: boolean, approvalStatus: ApprovalStatus, approvalSeps: ApprovalStepModel[]) {
    this._approvalID = approvalID;
    this._cdcmId = cdcmId;
    this._documentID = documentID;
    this._createdDate = createdDate;
    this._isSequential = isSequential;
    this._approvalStatus = approvalStatus;
    this._approvalSeps = approvalSeps;

  }

  get approvalID(): number {
    return this._approvalID;
  }

  get cdcmId(): number {
    return this._cdcmId;
  }

  get documentID(): number {
    return this._documentID;
  }

  get createdDate(): Date {
    return this._createdDate;
  }

  get isSequential(): boolean {
    return this._isSequential;
  }

  get approvalStatus(): ApprovalStatus {
    return this._approvalStatus;
  }

  get approvalSeps(): ApprovalStepModel[] {
    return this._approvalSeps;
  }



}
