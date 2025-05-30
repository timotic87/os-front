import { Component } from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {CreateDealDialogComponent} from "./create-deal-dialog/create-deal-dialog.component";
import {ProjectService} from "../services/project.service";
import {DatePipe, NgIf} from "@angular/common";
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";
import {RestService} from "../services/rest.service";
import {firstValueFrom} from "rxjs";
import {DialogService} from "../services/dialog.service";

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent {

  createDealDisable = true;
  openDealPage = false;
  editDeal = false;

  dealsArr: any = [];

  constructor(private matDialog: MatDialog, private router: Router, private rest: RestService, private userService: UserService, private dialogService: DialogService) {

    this.getNewDealArr();
    this.checkPermission();

  }

  createDeal(){
    const refDialog = this.matDialog.open(CreateDealDialogComponent, {
      minWidth: '900px',
      maxWidth: '1200px',
      maxHeight: '90vh'
    });
    refDialog.afterClosed().subscribe(status => {
      if (status == 200) {
        //todo bolja obrada novog deal... treba odradioti socket da se svima update i da se pokrene notifikacija ovde
        this.getNewDealArr();
      }
    })
  }

  onDealClick(deal){
    if (this.openDealPage) {
      this.router.navigate([`/deal/${deal.ID}`]);
    }else {
      this.dialogService.showMsgDialog('You dont have permission for deal view')
    }

  }

  getNewDealArr(){
    this.rest.getDeals().subscribe(res => {
      if(res.status == 200){
        this.dealsArr = res.data;
      }
    })
  }


  async checkPermission() {
    // 🚩 Odmah blokiraj dok traje proveravanje
    this.createDealDisable = true;

    try {
      const res = await firstValueFrom(this.rest.getUserPermissions(this.userService.getUser().id));
      const perm = res.data.find(permission => permission.name === 'create_deal');

      if (!perm.userId) {
        // createDealDisable ostaje true
      } else {
        this.createDealDisable = false;
      }

      const permOpenDealPage = res.data.find(permission => permission.name === 'view_deal');

      if (!permOpenDealPage.userId) {
      } else {
        this.openDealPage = true;
      }
    } catch (error) {
      console.error('❌ Error while checking permissions:', error);
      this.dialogService.showMsgDialog('Error while checking permissions');
      // createDealDisable ostaje true
    }
  }




}
