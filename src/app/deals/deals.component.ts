import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {CreateDealDialogComponent} from "./create-deal-dialog/create-deal-dialog.component";
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";
import {RestService} from "../services/rest.service";
import {firstValueFrom, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {DialogService} from "../services/dialog.service";
import {DealService} from "../services/deal.service";
import { CommonModule } from '@angular/common';
import {NotificationSocketService} from "../services/notification-socket.service";

// shadCN UI Components
import { ButtonComponent } from '../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../shared/components/ui/card/card.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    CommonModule,
    FormsModule,
    // shadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    BadgeComponent
  ],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  dealsArr: any[] = [];
  totalDeals = 0;
  pageSize = 30;
  offset = 0;

  filterStatusId?: number;
  filterLegalEntityId?: number;
  filterServiceId?: number;

  legalEntities = [];
  services = [];
  statuses = [];

  stats = { total: 0, active: 0, pending: 0, completed: 0, cancelled: 0 };
  activeStatCard: string | null = null;

  clientName: string = '';

  createDealDisable = true;
  openDealPage = false;

  constructor(private matDialog: MatDialog, private router: Router, private rest: RestService, private userService: UserService,
              private dialogService: DialogService, private dealService: DealService, private notService: NotificationSocketService) {
    this.checkPermission();
  }

  createDeal() {
    const refDialog = this.matDialog.open(CreateDealDialogComponent, {
      minWidth: '900px',
      maxWidth: '1200px',
      maxHeight: '90vh'
    });
    refDialog.afterClosed().subscribe(status => {
      if (status == 200) {
        // Deal created via socket event
      }
    });
  }

  onDealClick(deal) {
    if (this.openDealPage || this.userService.hasAnyEntityAccess('deal')) {
      this.router.navigate([`/deal/${deal.ID}`]);
    } else {
      this.dialogService.showMsgDialog('You dont have permission for deal view');
    }
  }

  async checkPermission() {
    this.createDealDisable = true;
    try {
      const res = await firstValueFrom(this.rest.getUserPermissions(this.userService.getUser().id));
      const perm = res.data.find(permission => permission.name === 'create_deal');
      if (perm?.userId) {
        this.createDealDisable = false;
      }
      const permOpenDealPage = res.data.find(permission => permission.name === 'view_deal');
      if (permOpenDealPage?.userId) {
        this.openDealPage = true;
      }
    } catch (error) {
      this.dialogService.showMsgDialog('Error while checking permissions');
    }
  }

  loadStats(): void {
    this.dealService.getDealStats().subscribe({
      next: res => {
        this.stats = res.data;
      }
    });
  }

  onStatCardClick(statusName: string): void {
    if (this.activeStatCard === statusName) {
      // Deselect - clear filter
      this.activeStatCard = null;
      this.filterStatusId = undefined;
    } else {
      this.activeStatCard = statusName;
      const status = this.statuses.find((s: any) => s.name.toLowerCase() === statusName.toLowerCase());
      this.filterStatusId = status?.ID;
    }
    this.offset = 0;
    this.reloadDeals();
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
        this.dealsArr = res.data;
        this.totalDeals = res.totalCount;
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Error loading deals: ' + err.status);
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

    this.loadStats();
    this.reloadDeals();

    this.notService.dealCreated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.reloadDeals();
      this.loadStats();
    });

    this.notService.dealStatusUpdated$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data?.dealId) {
        const dealIndex = this.dealsArr.findIndex(deal => deal.ID == data.dealId);
        if (dealIndex !== -1 && data.newStatus && data.newFlowStatus) {
          this.dealsArr[dealIndex].status = data.newStatus;
          this.dealsArr[dealIndex].flowStatus = data.newFlowStatus;
        } else {
          this.reloadDeals();
        }
      } else {
        this.reloadDeals();
      }
      this.loadStats();
    });
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
    if (this.offset < this.totalPages() - 1) {
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

  getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('active') || lowerStatus.includes('completed')) {
      return 'success';
    } else if (lowerStatus.includes('pending')) {
      return 'warning';
    } else if (lowerStatus.includes('cancelled')) {
      return 'destructive';
    } else {
      return 'outline';
    }
  }

  getFlowStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('in progress')) {
      return 'info';
    } else if (lowerStatus.includes('completed')) {
      return 'success';
    } else if (lowerStatus.includes('review')) {
      return 'warning';
    } else {
      return 'secondary';
    }
  }

  clearFilters(): void {
    this.filterStatusId = undefined;
    this.filterLegalEntityId = undefined;
    this.filterServiceId = undefined;
    this.clientName = '';
    this.activeStatCard = null;
    this.offset = 0;
    this.reloadDeals();
  }

  onPageSizeChange(): void {
    this.offset = 0;
    this.reloadDeals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
