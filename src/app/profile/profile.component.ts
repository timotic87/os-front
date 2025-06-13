import { Component } from '@angular/core';
import {DialogService} from "../services/dialog.service";
import {UserService} from "../services/user.service";
import {CookieService} from "ngx-cookie-service";
import {Router} from "@angular/router";
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import {Observable} from "rxjs";
import {RestService} from "../services/rest.service";
import {DatePipe} from "@angular/common";


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  uploadProgress$: Observable<number | undefined> | undefined;

  urlPic = null;

  progress = 0

  dealList;

  constructor(private dialogService: DialogService, public userService: UserService, private cookieService: CookieService, private router: Router, private storage: Storage, private rest: RestService) {
    this.urlPic=userService.getUser().picUrl
    this.getMyDeals();
  }

onChangePassClick(){
    this.dialogService.showMsgDialog('Coming soon!')
  }

  onLogoutClick(){
    this.cookieService.delete('jwt');
    this.router.navigate(['login'])
  }

  uploadFile(event: any): void {
    this.dialogService.showLoader()
    const file = event.target.files[0];
    const user = this.userService.getUser();
    const filePath = `uploads/${user.fullName}`;
    const fileRef = ref(this.storage, filePath);
    const task = uploadBytesResumable(fileRef, file);

    this.uploadProgress$ = new Observable<number>((observer) => {
      this.progress = 0;
      task.on('state_changed',
        (snapshot) => {
          this.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next(this.progress);

          if (this.progress === 100) {
            getDownloadURL(fileRef).then(url => {
              this.rest.changePicUrl({ picUrl: url, userId: user.id }).subscribe(res => {
                console.log(res);
                if (res.status !== 201) {
                  this.dialogService.errorDialog(res);
                } else {
                  this.userService.updatePicUrl(url);
                  this.urlPic = this.userService.getUser().picUrl;
                  this.dialogService.closeLoader()
                  window.location.reload();
                }
              });
            }).catch(error => {
              observer.error(error);
              this.dialogService.closeLoader()
              this.dialogService.errorDialog(error);
            });
          }
        },
        (error) => {
          observer.error(error);
          this.dialogService.errorDialog(error);
        },
        () => {
          observer.complete();
        }
      );
    });

    this.uploadProgress$.subscribe({
      next: (progress) => console.log(`Upload progress: ${progress}%`),
      error: (error) => console.error('Upload failed', error),
      complete: () => console.log('Upload complete')
    });
  }

  getMyDeals(){
    this.dialogService.showLoader();
    this.rest.getDealsByEntityAccess().subscribe({
      next: res=>{
        this.dialogService.closeLoader();
        this.dealList = res.data;
      },
      error: err=>{
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
      }
    })
  }

  onDealClick(deal){
      this.router.navigate([`/deal/${deal.ID}`]);
  }

}
