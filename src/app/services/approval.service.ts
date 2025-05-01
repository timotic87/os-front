import { Injectable } from '@angular/core';
import {RestService} from "./rest.service";
import {DialogService} from "./dialog.service";
import {catchError, map, Observable, of, Subject, tap} from "rxjs";
import {MatDialog} from "@angular/material/dialog";
import {ApprovalStepModel} from "../models/approval/ApprovalStepModel";
import {ApprovalStatus} from "../models/approval/approvalStatus";
import {ApprovalModel} from "../models/approval/approvalModel";

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {

  updateApprovalTemplteSubject = new Subject<any>()

  constructor(private rest: RestService, private dialogService: DialogService, private matDialog: MatDialog) { }

  public getApprovalTemplateByID(id: number): Observable<any> {
    this.dialogService.showLoader();
    return this.rest.getApprovalTemplateByID(id).pipe(
      map(res => {
        this.dialogService.closeLoader();
        if (res['status'] === 200) {
          let obj = res['data'][0];
          obj.approvalStep = !Array.isArray(res['data'][1]) ? [res['data'][1]]:res['data'][1];
          if (!res['data'][1]) obj.approvalStep = null
          return obj;
        }
        return null;
      }),
      catchError(err => {
        this.dialogService.closeLoader();
        this.dialogService.errorDialog(err);
        console.log(err);
        return of(null); // `of` se koristi da bi se vratila vrednost unutar Observable-a
      })
    );
  }

  public async getApprovalsByCdcmID(cdcmID:number):Promise<ApprovalModel> {
    this.dialogService.showLoader();

    try {
      const res = await this.rest.getApprovalsByCdcmID(cdcmID).toPromise();
      this.matDialog.closeAll();
      if (res.status === 200) {
        let approvalSeps: ApprovalStepModel[] = [];

          for (let item of res.data) {
            approvalSeps.push(new ApprovalStepModel(item.ApprovalStepID, item.approvalID,
              item.userID, item.firstName, item.lastName, item.stepOrder, new ApprovalStatus(item.approvalStepStatusID,
                item.approvalStepStatusName), item.approvalStepStatusChangeDate, item.profilePicUrl, item.comment));
          }

        return new ApprovalModel(res.data[0].approvalID, res.data[0].cdcmID, res.data[0].documentID, res.data[0].approvalCreatedDate, res.data[0].isSequential,
          new ApprovalStatus(res.data[0].approvalStatusID, res.data[0].approvalStatusName), approvalSeps);

      }
      return null;
    }catch (e) {
      return null;
    }
  }

}
