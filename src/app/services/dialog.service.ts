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

  constructor(private matDialog: MatDialog, private snackBar: MatSnackBar) { }

  showChooseDialog(msg){
    return this.matDialog.open(ChooseDialogComponent, {
      minWidth: '400px',
      maxHeight: '700px',
      data: {msg}
    });
  }

  showMultiOptionDialog(data){
    return this.matDialog.open(MultiOptionDialogComponent, {
      minWidth: '400px',
      maxHeight: '700px',
      data: data
    });
  }

  showMsgDialog(msg){
    return this.matDialog.open(MsgDialogComponent, {
      minWidth: '400px',
      maxHeight: '700px',
      data: {msg}
    });
  }

  showSnackBar(msg: string, action: string, durration:number){
    this.snackBar.open(msg,  action, {duration: durration})
  }

  errorDialog(res: any){
    this.showMsgDialog(`code: ${res.status} msg: ${res.msg}`)
  }

  showLoader(){
    this.loaderRef = this.matDialog.open(LoaderComponent, {
      width: '100vh',
      height: '100%'
    });
  }
  closseLoader(){
    setTimeout(()=>{
      if (this.loaderRef){
        this.loaderRef.close();
        this.loaderRef=null;
      }
    }, 500);
  }
}
