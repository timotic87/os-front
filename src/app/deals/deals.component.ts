import { Component } from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {CreateDealDialogComponent} from "./create-deal-dialog/create-deal-dialog.component";
import {ProjectService} from "../services/project.service";
import {DatePipe, NgIf} from "@angular/common";
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";
import {RestService} from "../services/rest.service";

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

  dealsArr: any = [];

  constructor(private matDialog: MatDialog, private router: Router, private rest: RestService, private userService: UserService) {

    this.getNewDealArr();
    // this.rest.getUserPermisions(userService.getUser().id).subscribe(res => {
    //   if (res.status === 200) {
    //     let perm = res.data.find(permision => permision.id === 22);
    //     this.createDealDisable = perm.userId ? false : true;
    //   }
    //
    // });

    userService.checkPermission(22, (hasPerm)=>{
      this.createDealDisable = hasPerm;
    });

  }

  createDeal(){
    const refDialog = this.matDialog.open(CreateDealDialogComponent, {
      minWidth: '900px',
      maxWidth: '1200px',
      maxHeight: '90vh'
    });
    refDialog.afterClosed().subscribe(status => {
      if (status == 200) {
        this.getNewDealArr();
      }
    })
  }

  onProjectClick(deal){
    this.router.navigate([`/deal/${deal.ID}`])
    // const url = window.location.origin + `/project/${project.ID}`; // Dodaj query parametar`
    // window.open(url, '_blank');
  }

  getNewDealArr(){
    this.rest.getDeals().subscribe(res => {
      if(res.status == 200){
        console.log(res.data)
        this.dealsArr = res.data;
      }
    })
  }



}
