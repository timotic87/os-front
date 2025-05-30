import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DatePipe, NgForOf} from "@angular/common";
import {RestService} from "../../../services/rest.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DialogService} from "../../../services/dialog.service";
import {UserService} from "../../../services/user.service";
import {io, Socket} from "socket.io-client";
import {environment} from "../../../../environments/environment";
import {socketEnum} from "../../../services/enum-sevice";
import {firstValueFrom} from "rxjs";

@Component({
  selector: 'app-deal-coments-dialog',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf,
    ReactiveFormsModule
  ],
  templateUrl: './deal-coments-dialog.component.html',
  styleUrl: './deal-coments-dialog.component.css'
})
export class DealComentsDialogComponent implements OnInit{

  commentForm: FormGroup;

  commentText = null;

  commentArr=[]

  createCommentPerm: boolean = false;

  socket: Socket;

  constructor(@Inject(MAT_DIALOG_DATA) public dealID, private rest: RestService, private dialogService: DialogService,
              private userService: UserService, private dialogRef: MatDialogRef<DealComentsDialogComponent>,) {

    this.socket = io(environment.SERVER_URL);
    // @ts-ignore
    this.socket.on(socketEnum.CREATE_DEAL_COMMENT, data=>{
      if(data.success && data.dealComment.dealID===this.dealID){
        this.getAllComments();
      }
    });
    this.getAllComments();

  }

  ngOnInit(): void {
        this.commentForm = new FormGroup({
          commentText: new FormControl(null, [Validators.required]),
        });
    }

  sendComment(){
    if(this.createCommentPerm){

      this.dialogService.showMsgDialog("You don't have permission to send comment");
      return;
    }
    if(this.commentForm.valid){
      this.dialogService.showLoader();
      const data = { dealID: this.dealID, comment: this.commentForm.value.commentText };
      this.rest.createDealComment(data).subscribe(res=>{
        this.dialogService.closeLoader();
      });
    }else {

    }
  }
  getAllComments(){
    this.rest.getDealComments(this.dealID).subscribe(res=>{
      if (res.status === 200){
        this.commentArr = res.data.dealComments
      }
    })
  }


  async checkPermission() {

    try {
      const res = await firstValueFrom(this.rest.getUserPermissions(this.userService.getUser().id));

      const permCreateComment = res.data.find(permission => permission.name === 'create_all_comments');

      if (permCreateComment.userId) {
        this.createCommentPerm = true;
      }

    } catch (error) {
      console.error('❌ Error while checking permissions:', error);
      this.dialogService.showMsgDialog('Error while checking permissions');
    }
  }
}
