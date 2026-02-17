import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { RestService } from '../services/rest.service';
import { DialogService } from '../services/dialog.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationSocketService } from '../services/notification-socket.service';

// shadCN UI Components
import { ButtonComponent } from '../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../shared/components/ui/card/card.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-recruiting-orders',
  standalone: true,
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    BadgeComponent
  ],
  templateUrl: './recruiting-orders.component.html'
})
export class RecruitingOrdersComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  ordersArr: any[] = [];
  totalOrders = 0;
  pageSize = 30;
  offset = 0;

  filterStatusId?: number;
  clientName = '';
  myAssignments = false;

  statuses: any[] = [];
  stats = { total: 0, open: 0, inProgress: 0, filled: 0, cancelled: 0 };
  activeStatCard: string | null = null;

  constructor(
    private router: Router,
    private rest: RestService,
    public userService: UserService,
    private dialogService: DialogService,
    private notService: NotificationSocketService
  ) {}

  ngOnInit(): void {
    this.rest.getRecruitingOrderStatuses().subscribe(res => this.statuses = res.data);
    this.loadStats();
    this.reloadOrders();

    this.notService.recruitingOrderCreated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.reloadOrders();
      this.loadStats();
    });
  }

  loadStats(): void {
    this.rest.getRecruitingOrderStats().subscribe({
      next: res => {
        this.stats = res.data;
      }
    });
  }

  reloadOrders(): void {
    this.dialogService.showLoader();

    const params: any = {
      offset: this.offset * this.pageSize,
      rowsNum: this.pageSize,
      statusId: this.filterStatusId,
      clientName: this.clientName.trim() !== '' ? this.clientName.trim() : undefined,
      assignedUserId: this.myAssignments ? this.userService.getUser().id : undefined
    };

    this.rest.getRecruitingOrders(params).subscribe({
      next: res => {
        this.ordersArr = res.data;
        this.totalOrders = res.totalCount;
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Error loading recruiting orders: ' + err.status);
      },
      complete: () => {
        this.dialogService.closeLoader();
      }
    });
  }

  onStatCardClick(statusName: string): void {
    if (this.activeStatCard === statusName) {
      this.activeStatCard = null;
      this.filterStatusId = undefined;
    } else {
      this.activeStatCard = statusName;
      const status = this.statuses.find((s: any) => s.name.toLowerCase() === statusName.toLowerCase());
      this.filterStatusId = status?.ID;
    }
    this.offset = 0;
    this.reloadOrders();
  }

  toggleMyAssignments(): void {
    this.myAssignments = !this.myAssignments;
    this.offset = 0;
    this.reloadOrders();
  }

  clearFilters(): void {
    this.filterStatusId = undefined;
    this.clientName = '';
    this.myAssignments = false;
    this.activeStatCard = null;
    this.offset = 0;
    this.reloadOrders();
  }

  onOrderClick(order: any): void {
    this.router.navigate([`/recruiting-order/${order.ID}`]);
  }

  getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
    const lower = status.toLowerCase();
    if (lower === 'open') return 'success';
    if (lower === 'in progress') return 'info';
    if (lower === 'filled') return 'default';
    if (lower === 'cancelled') return 'destructive';
    return 'outline';
  }

  // Pagination
  goToPreviousPage(): void {
    if (this.offset > 0) {
      this.offset--;
      this.reloadOrders();
    }
  }

  goToNextPage(): void {
    if (this.offset < this.totalPages() - 1) {
      this.offset++;
      this.reloadOrders();
    }
  }

  totalPages(): number {
    return Math.ceil(this.totalOrders / this.pageSize);
  }

  onPageSizeChange(): void {
    this.offset = 0;
    this.reloadOrders();
  }

  protected readonly Math = Math;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
