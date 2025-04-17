import { Component } from '@angular/core';
import {DialogService} from "../services/dialog.service";
import {UserService} from "../services/user.service";
import {CookieService} from "ngx-cookie-service";
import {Router} from "@angular/router";
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import {Observable} from "rxjs";
import {AsyncPipe, NgIf} from "@angular/common";
import {RestService} from "../services/rest.service";


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  uploadProgress$: Observable<number | undefined> | undefined;

  urlPic = null;

  progress = 0

  constructor(private dialogService: DialogService, public userService: UserService, private cookieService: CookieService, private router: Router, private storage: Storage, private rest: RestService) {
    this.urlPic=userService.getUser().picUrl
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

  async getUrl(){
    // const filePath = `uploads/1.jpg`;
    // const fileRef = ref(this.storage, filePath);
    // // @ts-ignore
    // this.downloadURL$ = new Observable<string | undefined>(async (observer) => {
    //   const url = await getDownloadURL(fileRef);
    //   observer.next(url);
    // });
  }

}
