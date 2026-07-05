import { Injectable } from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {ChooseDialogComponent} from "../dialogComponents/choose-dialog/choose-dialog.component";
import {MsgDialogComponent} from "../dialogComponents/msg-dialog/msg-dialog.component";
import {MatSnackBar} from '@angular/material/snack-bar';
import {LoaderComponent} from "../dialogComponents/loader/loader.component";
import {MultiOptionDialogComponent} from "../dialogComponents/multi-option-dialog/multi-option-dialog.component";

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  loaderRef;
  private loaderCount = 0;

  constructor(private matDialog: MatDialog, private snackBar: MatSnackBar) { }

  showChooseDialog(msg: any){
    return this.matDialog.open(ChooseDialogComponent, {
      minWidth: '400px',
      maxHeight: '700px',
      data: {msg}
    });
  }

  showMultiOptionDialog(data: any){
    return this.matDialog.open(MultiOptionDialogComponent, {
      minWidth: '400px',
      maxHeight: '700px',
      data: data
    });
  }

  showMsgDialog(msg: any){
    return this.matDialog.open(MsgDialogComponent, {
      minWidth: '400px',
      maxHeight: '700px',
      data: {msg}
    });
  }

  showERRMsgDialog(data: any){
    return this.matDialog.open(MsgDialogComponent, {
      minWidth: '400px',
      maxHeight: '700px',
      data: data
    });
  }

  showSnackBar(msg: string, action: string, durration:number){
    this.snackBar.open(msg,  action, {duration: durration})
  }

  errorDialog(res: any){
    this.showMsgDialog(`code: ${res.status} msg: ${res.msg}`)
  }
  errorServDialog(err: any){
    this.showERRMsgDialog({msg: `status: ${err.status} msg: ${err.error.message}`, errorMsg: err.message})
  }

  showLoader(){
    // Brojač dozvoljava preklapanje više paralelnih operacija sa JEDNIM loader dialogom.
    this.loaderCount++;
    if (!this.loaderRef){
      this.loaderRef = this.matDialog.open(LoaderComponent, {
        width: '100vh',
        height: '100%'
      });
    }
  }
  closeLoader(){
    if (this.loaderCount > 0){
      this.loaderCount--;
    }
    // Zatvaramo tek kad su SVE operacije završene.
    if (this.loaderCount === 0 && this.loaderRef){
      this.loaderRef.close();
      this.loaderRef=null;
    }
  }

  forceCloseLoader(){
    this.loaderCount = 0;
    if (this.loaderRef){
      this.loaderRef.close();
      this.loaderRef=null;
    }
    // Also try to close any potentially remaining dialogs
    this.matDialog.closeAll();
  }
}
