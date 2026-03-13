import { Component } from '@angular/core';
import {DialogService} from "../services/dialog.service";
import {UserService} from "../services/user.service";
import {CookieService} from "ngx-cookie-service";
import {Router} from "@angular/router";
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

  urlPic = null;

  constructor(
    private dialogService: DialogService,
    public userService: UserService,
    private cookieService: CookieService,
    private router: Router,
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

    if (!file.type.startsWith('image/')) {
      this.dialogService.showMsgDialog('Please select an image file.');
      return;
    }

    this.dialogService.showLoader();

    this.rest.uploadProfilePic(file).subscribe({
      next: (res) => {
        if (res.status === 201 && res.data?.picUrl) {
          this.userService.updatePicUrl(res.data.picUrl);
          this.urlPic = res.data.picUrl;
          this.dialogService.closeLoader();
          window.location.reload();
        } else {
          this.dialogService.closeLoader();
          this.dialogService.showMsgDialog('Error uploading profile picture');
        }
      },
      error: (err) => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Upload failed: ' + (err.error?.message || err.message));
      }
    });
  }
}
