import {Component, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {CreateDealDialogComponent} from "./create-deal-dialog/create-deal-dialog.component";
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";
import {RestService} from "../services/rest.service";
import {firstValueFrom} from "rxjs";
import {DialogService} from "../services/dialog.service";
import {DealService} from "../services/deal.service";
import { CommonModule } from '@angular/common';
import {io} from "socket.io-client";
import {environment} from "../../environments/environment";
import {NotificationSocketService} from "../services/notification-socket.service";

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent implements OnInit {

  dealsArr: any[] = [];
  totalDeals = 0;
  pageSize = 30;
  offset = 0;

// Filteri
  filterStatusId?: number;
  filterLegalEntityId?: number;
  filterServiceId?: number;

  legalEntities = [];
  services = [];
  subservices = [];
  statuses = [];

  clientName: string = '';

  createDealDisable = true;
  openDealPage = false;

  socket  = io(environment.SERVER_URL);

  constructor(private matDialog: MatDialog, private router: Router, private rest: RestService, private userService: UserService,
              private dialogService: DialogService, private dealService: DealService, private notService: NotificationSocketService) {

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

  reloadDeals(): void {
    this.dialogService.showLoader();
    this.dealService.getDealsFiltered({
      offset: this.offset * this.pageSize,
      rowsNum: this.pageSize,
      statusId: this.filterStatusId,
      legalEntityId: this.filterLegalEntityId,
      serviceId: this.filterServiceId,
      clientName: this.clientName.trim() !== '' ? this.clientName.trim() : undefined
    }).subscribe({
      next: res => {
        console.log(res)
        this.dealsArr = res.data;
        this.totalDeals = res.totalCount;
      },
      error: err => {
        console.log(err)
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('❌ Greška prilikom učitavanja deals: ' + err.status);
      },
      complete: () => {
        this.dialogService.closeLoader();
      }
    });
  }

  ngOnInit(): void {
    this.rest.getLEList().subscribe(res => this.legalEntities = res.data);
    this.rest.getServices().subscribe(res => this.services = res.data);
    this.rest.getDealStatuses().subscribe(res => this.statuses = res.data);

    this.reloadDeals();

    this.notService.dealCreated$.subscribe(data=>{
      this.reloadDeals();
    })

  }

  goToPage(pageIndex: number): void {
    if (pageIndex !== this.offset) {
      this.offset = pageIndex;
      this.reloadDeals();
    }
  }

  goToPreviousPage(): void {
    if (this.offset > 0) {
      this.offset--;
      this.reloadDeals();
    }
  }

  goToNextPage(): void {
    const totalPages = Math.ceil(this.totalDeals / this.pageSize);
    if (this.offset < totalPages - 1) {
      this.offset++;
      this.reloadDeals();
    }
  }

  totalPages(): number {
    return Math.ceil(this.totalDeals / this.pageSize);
  }

  getPages(): number[] {
    const pagesCount = this.totalPages();
    const range: number[] = [];

    // Ako ima manje od 10 stranica, prikaži sve
    if (pagesCount <= 10) {
      for (let i = 0; i < pagesCount; i++) {
        range.push(i);
      }
    } else {
      let start = Math.max(0, this.offset - 2);
      let end = Math.min(pagesCount, this.offset + 3);

      if (this.offset < 3) {
        end = 5;
      } else if (this.offset > pagesCount - 4) {
        start = pagesCount - 5;
      }

      for (let i = start; i < end; i++) {
        range.push(i);
      }
    }

    return range;
  }

  protected readonly Math = Math;
}
