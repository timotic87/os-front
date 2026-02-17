import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { UserService } from '../../services/user.service';
import { AddPositionDialogComponent } from '../../deals/deal/add-position-dialog/add-position-dialog.component';
import { RecruitingInvoiceDialogComponent } from '../recruiting-invoice-dialog/recruiting-invoice-dialog.component';
// ShadCN UI Components
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-recruiting-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './recruiting-order.component.html'
})
export class RecruitingOrderComponent implements OnInit {

  order: any = null;
  statuses: any[] = [];
  users: any[] = [];
  invoices: any[] = [];
  loading = true;
  orderId!: number;
  userSearch = '';
  filteredUsers: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rest: RestService,
    private dialogService: DialogService,
    public userService: UserService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder();
    this.loadStatuses();
    this.loadUsers();
    this.loadInvoices();
  }

  loadOrder(): void {
    this.rest.getRecruitingOrderByID(this.orderId).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.order = res.data;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.dialogService.showMsgDialog('Error loading order: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  loadStatuses(): void {
    this.rest.getRecruitingOrderStatuses().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.statuses = res.data;
        }
      }
    });
  }

  loadUsers(): void {
    this.rest.getUsers().subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.users = res.data || [];
          this.filteredUsers = [...this.users];
        }
      }
    });
  }

  changeOrderStatus(statusID: number): void {
    this.rest.changeRecruitingOrderStatus({ orderID: this.order.ID, statusID }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Order status updated', '', 3000);
          this.loadOrder();
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  changePositionStatus(positionID: number, statusID: number): void {
    this.rest.changePositionStatus({ positionID, statusID }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Position status updated', '', 3000);
          this.loadOrder();
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  addPosition(): void {
    const dialogRef = this.dialog.open(AddPositionDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { orderID: this.order.ID }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrder();
      }
    });
  }

  assignRecruiter(positionID: number, userID: number): void {
    this.rest.assignRecruiter({ positionId: positionID, userId: userID }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Recruiter assigned', '', 3000);
          this.loadOrder();
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  unassignRecruiter(positionID: number, userID: number): void {
    this.rest.unassignRecruiter({ positionId: positionID, userId: userID }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Recruiter unassigned', '', 3000);
          this.loadOrder();
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  canEditOrder(): boolean {
    return this.userService.can('edit_recruiting_order');
  }

  canEditPosition(position: any): boolean {
    if (this.userService.can('edit_recruiting_order')) return true;
    const currentUserId = this.userService.getUser()?.id;
    return position.assignments?.some((a: any) => a.user_id === currentUserId);
  }

  goToDeal(): void {
    if (this.order?.dealID) {
      this.router.navigate(['/deal', this.order.dealID]);
    }
  }

  goBack(): void {
    this.goToDeal();
  }

  filterUsers(search: string): void {
    if (!search) {
      this.filteredUsers = [...this.users];
      return;
    }
    const s = search.toLowerCase();
    this.filteredUsers = this.users.filter((u: any) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(s)
    );
  }

  isUserAssigned(position: any, userId: number): boolean {
    return position.assignments?.some((a: any) => a.user_id === userId);
  }

  getAvailableUsers(position: any): any[] {
    return this.users.filter((u: any) => !this.isUserAssigned(position, u.id));
  }

  // Helper methods from details dialog
  getStatusVariant(statusID: number): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (statusID) {
      case 1: return 'success';
      case 2: return 'secondary';
      case 3: return 'default';
      case 4: return 'destructive';
      default: return 'outline';
    }
  }

  getCurrencySymbol(currencyId: number): string {
    const map: any = { 1: 'RSD', 2: 'EUR', 3: 'USD' };
    return map[currencyId] || 'RSD';
  }

  getSalaryTypeName(salaryTypeId: number): string {
    const map: any = { 1: 'Monthly Gross', 2: 'Monthly Net', 3: 'Yearly Gross', 4: 'Yearly Net' };
    return map[salaryTypeId] || '';
  }

  getFeeTypeName(feeTypeId: number): string {
    const map: any = { 1: 'Percentage', 2: 'Multiplier', 3: 'Fixed fee' };
    return map[feeTypeId] || '';
  }

  // Invoice methods

  loadInvoices(): void {
    this.rest.getInvoicesByOrderID(this.orderId).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.invoices = res.data || [];
          this.cdr.detectChanges();
        }
      }
    });
  }

  openInvoiceDialog(position: any, mode: 'placement' | 'admin_fee' | 'cancel_fee'): void {
    const dialogRef = this.dialog.open(RecruitingInvoiceDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { mode, position, orderID: this.order.ID }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrder();
        this.loadInvoices();
      }
    });
  }

  canClosePosition(position: any): boolean {
    return (position.number_filled || 0) < position.number_of_people;
  }

  getInvoiceTypeLabel(type: string): string {
    switch (type) {
      case 'placement': return 'Placement';
      case 'admin_fee': return 'Admin Fee';
      case 'cancel_fee': return 'Cancel Fee';
      default: return type;
    }
  }

  getInvoiceTypeBadgeVariant(type: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (type) {
      case 'placement': return 'success';
      case 'admin_fee': return 'info';
      case 'cancel_fee': return 'warning';
      default: return 'outline';
    }
  }
}
