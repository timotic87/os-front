import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DatePipe} from "@angular/common";
import {RestService} from "../../services/rest.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {DialogService} from "../../services/dialog.service";
import {UserService} from "../../services/user.service";
import {socketEnum} from "../../services/enum-sevice";
import {firstValueFrom} from "rxjs";
import {NotificationSocketService} from "../../services/notification-socket.service";

@Component({
  selector: 'app-deal-coments-dialog',
  standalone: true,
  imports: [
    DatePipe,
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
  commentAdded: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public dealID, private rest: RestService, private dialogService: DialogService,
              private userService: UserService, private dialogRef: MatDialogRef<DealComentsDialogComponent>,
              private notificationSocketService: NotificationSocketService) {

    // TODO: Replace with proper socket handling through NotificationSocketService
    // Listen for deal comments through the existing socket service instead of creating new connection
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
      this.rest.createDealComment(data).subscribe({
        next: () => {
          this.dialogService.closeLoader();
          this.commentForm.reset();
          this.getAllComments();
          this.commentAdded = true;
        },
        error: err => {
          this.dialogService.closeLoader();
          this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
        }
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

}
