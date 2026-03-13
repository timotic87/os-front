import { Component } from '@angular/core';
import {DialogService} from "../services/dialog.service";
import {UserService} from "../services/user.service";
import {CookieService} from "ngx-cookie-service";
import {Router} from "@angular/router";
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import {Observable} from "rxjs";
import {RestService} from "../services/rest.service";

import { ButtonComponent } from '../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../shared/components/ui/card/card.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  uploadProgress$: Observable<number | undefined> | undefined;
  urlPic = null;
  progress = 0;

  constructor(
    private dialogService: DialogService,
    public userService: UserService,
    private cookieService: CookieService,
    private router: Router,
    private storage: Storage,
    private rest: RestService
  ) {
    this.urlPic = userService.getUser().picUrl;
  }

  onChangePassClick() {
    this.dialogService.showMsgDialog('Coming soon!');
  }

  onLogoutClick() {
    this.cookieService.delete('jwt');
    this.router.navigate(['login']);
  }

  uploadFile(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.dialogService.showLoader();
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
        },
        (error) => {
          observer.error(error);
          this.dialogService.closeLoader();
          this.dialogService.errorDialog(error);
        },
        () => {
          // Upload complete - now safe to get download URL
          getDownloadURL(fileRef).then(url => {
            this.rest.changePicUrl({ picUrl: url, userId: user.id }).subscribe(res => {
              if (res.status !== 201) {
                this.dialogService.closeLoader();
                this.dialogService.errorDialog(res);
              } else {
                this.userService.updatePicUrl(url);
                this.urlPic = this.userService.getUser().picUrl;
                this.dialogService.closeLoader();
                window.location.reload();
              }
            });
          }).catch(error => {
            observer.error(error);
            this.dialogService.closeLoader();
            this.dialogService.errorDialog(error);
          });
          observer.complete();
        }
      );
    });

    this.uploadProgress$.subscribe({
      error: (error) => console.error('Upload failed', error),
      complete: () => {}
    });
  }
}
