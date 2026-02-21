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
import { EditPositionDialogComponent } from '../edit-position-dialog/edit-position-dialog.component';
import { RecruitingInvoiceDialogComponent } from '../recruiting-invoice-dialog/recruiting-invoice-dialog.component';
import { ApprovalCardComponent } from '../../customComponents/approval-card/approval-card.component';
import { HistoryDialogComponent } from '../../customComponents/history-dialog/history-dialog.component';
import * as XLSX from 'xlsx';
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
    BadgeComponent,
    ApprovalCardComponent
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

  editPosition(position: any): void {
    const dialogRef = this.dialog.open(EditPositionDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { position, invoices: this.invoices }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrder();
        this.loadInvoices();
      }
    });
  }

  deletePosition(position: any): void {
    if (this.hasNonRejectedInvoices(position)) {
      this.dialogService.showMsgDialog('Cannot delete a position that has non-rejected invoices.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete position "${position.position_number} - ${position.position_name}"?`
    );
    if (!confirmed) return;

    this.rest.deletePosition({ positionID: position.ID }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Position deleted', '', 3000);
          this.loadOrder();
          this.loadInvoices();
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  hasNonRejectedInvoices(position: any): boolean {
    return (this.invoices || []).some(
      (inv: any) => inv.position_id === position.ID && inv.status !== 'rejected' && !inv.deleted
    );
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

  openHistory(): void {
    if (!this.userService.can('view_deal_history') && !this.userService.can('view_entity_history')) {
      this.dialogService.showMsgDialog("You don't have the right to see the history.");
      return;
    }

    this.dialog.open(HistoryDialogComponent, {
      width: '75vw',
      maxHeight: '90vh',
      data: { entity: 'RecruitingOrder', entityID: this.orderId, title: 'Recruiting Order History' },
    });
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
    const positionInvoices = (this.invoices || []).filter(
      (inv: any) => inv.position_id === position.ID && !inv.deleted
    );
    const dialogRef = this.dialog.open(RecruitingInvoiceDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: {
        mode, position, orderID: this.order.ID,
        existingInvoices: positionInvoices,
        clientCurrency: this.order?.deal?.client?.currency || null
      }
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

  /** Check if a non-rejected admin_fee invoice exists for this position */
  hasAdminFeeInvoice(position: any): boolean {
    return (this.invoices || []).some(
      (inv: any) => inv.position_id === position.ID && inv.invoice_type === 'admin_fee' && inv.status !== 'rejected'
    );
  }

  /** Check if a non-rejected cancel_fee invoice exists for this position */
  hasCancelFeeInvoice(position: any): boolean {
    return (this.invoices || []).some(
      (inv: any) => inv.position_id === position.ID && inv.invoice_type === 'cancel_fee' && inv.status !== 'rejected'
    );
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

  getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'secondary' {
    switch (status) {
      case 'pending_approval': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending_approval': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  onApprovalUpdated(event: any): void {
    this.loadInvoices();
    this.loadOrder();
  }

  onAllApprovalsCompleted(event: any): void {
    this.loadInvoices();
    this.loadOrder();
  }

  exportInvoiceCalculation(inv: any): void {
    this.rest.getInvoiceCalculationData(inv.ID).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          const { invoice, calculationData } = res.data;
          this.buildAndExportExcel(invoice, calculationData);
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error loading calculation data: ' + (err.error?.message || err.message));
      }
    });
  }

  private buildAndExportExcel(invoice: any, calcData: any): void {
    if (!calcData) {
      this.dialogService.showSnackBar('No calculation data available for this invoice', '', 3000);
      return;
    }

    const pos = calcData.position || {};
    const cur = calcData.feeCurrencyCode || 'EUR';
    const date = new Date(invoice.created_at).toLocaleDateString('sr-RS');
    const rows: any[][] = [];
    const invoiceType = invoice.invoice_type;

    if (invoiceType === 'admin_fee') {
      rows.push(
        ['Admin Fee Calculation', ''],
        ['', ''],
        ['Position', `${pos.position_number || ''} - ${pos.position_name || ''}`],
        ['Date', date],
        ['', ''],
        ['Expected Salary', pos.expected_salary],
        [`Derived Salary (${this.getDerivedSalaryLabel(calcData.derivedSalaryType, pos.salary_type_id)})`, `${calcData.derivedSalaryForFee} ${cur}`],
        [`Projected Fee per Person (${this.getMainFeeConfigLabel(pos)})`, `${calcData.projectedFeePerPerson} ${cur}`],
        [`Admin Fee per Person (${this.getExtraFeeConfigLabel(pos)})`, `${calcData.adminFeePerPerson} ${cur}`],
        ['Headcount', calcData.headcount || pos.number_of_people],
        ['', ''],
        ['Total Admin Fee', `${calcData.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${calcData.finalFee} ${cur}`],
      );
    } else {
      const typeLabel = invoiceType === 'placement' ? 'Placement Fee' : 'Cancel Fee';
      rows.push(
        [`${typeLabel} Calculation`, ''],
        ['', ''],
        ['Position', `${pos.position_number || ''} - ${pos.position_name || ''}`],
        ['Date', date],
      );

      if (invoice.candidate_first_name) {
        rows.push(['Candidate', `${invoice.candidate_first_name} ${invoice.candidate_last_name}`]);
      }

      rows.push(
        ['', ''],
        ['Entered Salary', calcData.salaryInput?.amount],
        ['Salary Type', invoice.salaryType?.name || ''],
        [`Derived Salary (${this.getDerivedSalaryLabel(calcData.derivedSalaryType, pos.salary_type_id)})`, `${calcData.derivedSalaryForFee} ${cur}`],
        ['Fee Formula', this.getFeeFormulaLabel(calcData.feeSnapshot)],
        ['', ''],
        ['Calculated Fee', `${calcData.calculatedFee} ${cur}`],
        ['Final Fee Amount', `${calcData.finalFee} ${cur}`],
      );
    }

    if (calcData.feeWasOverridden) {
      rows.push(['Fee Override', 'Yes (manually adjusted)']);
    }

    // Salary calculator breakdown
    const calcResults = calcData.calculatorResults;
    if (calcResults) {
      rows.push(['', ''], ['Salary Calculator Results', ''], ['', 'RSD', 'EUR', 'USD']);
      const labels: Record<string, string> = {
        monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Base Gross', monthlyGrandGross: 'Monthly Grand Gross',
        annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
      };
      for (const [key, label] of Object.entries(labels)) {
        rows.push([
          label,
          calcResults['RSD']?.[key] || '',
          calcResults['EUR']?.[key] || '',
          calcResults['USD']?.[key] || ''
        ]);
      }
    }

    // Exchange rates
    if (calcData.exchangeRates) {
      rows.push(['', ''], ['Exchange Rates', '']);
      if (calcData.exchangeRates.EUR) {
        rows.push(['1 EUR', `${calcData.exchangeRates.EUR} RSD`]);
      }
      if (calcData.exchangeRates.USD) {
        rows.push(['1 USD', `${calcData.exchangeRates.USD} RSD`]);
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Calculation');

    const typeSlug = invoiceType === 'admin_fee' ? 'AdminFee' :
                     invoiceType === 'placement' ? 'Placement' : 'CancelFee';
    XLSX.writeFile(wb, `${typeSlug}_${pos.position_number || invoice.ID}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  private getDerivedSalaryLabel(key: string | null, salaryTypeId?: number): string {
    const map: Record<string, string> = {
      monthlyNet: 'Monthly Net', monthlyGross: 'Monthly Gross', monthlyGrandGross: 'Monthly Grand Gross',
      annualNet: 'Annual Net', annualGross: 'Annual Base Gross', annualGrandGross: 'Annual Grand Gross'
    };
    if (key && map[key]) return map[key];
    if (salaryTypeId) {
      const typeMap: Record<number, string> = {
        1: 'monthlyGrandGross', 2: 'monthlyGross', 3: 'monthlyNet',
        4: 'annualGross', 5: 'annualGrandGross', 6: 'annualNet'
      };
      const derived = typeMap[salaryTypeId];
      if (derived && map[derived]) return map[derived];
    }
    return key || '';
  }

  private getFeeFormulaLabel(feeSnapshot: any): string {
    if (!feeSnapshot) return 'N/A';
    switch (feeSnapshot.fee_types_id) {
      case 1: return `${feeSnapshot.fee_percentage}%`;
      case 2: return `${feeSnapshot.fee_multiplier}x`;
      case 3: return `Fixed: ${feeSnapshot.fee_fixed_amount}`;
      default: return 'N/A';
    }
  }

  private getMainFeeConfigLabel(pos: any): string {
    switch (pos.fee_types_id) {
      case 1: return `${pos.fee_percentage}%`;
      case 2: return `${pos.fee_multiplier}x`;
      case 3: return `Fixed: ${pos.fee_amount}`;
      default: return 'N/A';
    }
  }

  private getExtraFeeConfigLabel(pos: any): string {
    switch (pos.extra_fee_calculation_type) {
      case 1: return `${pos.extra_fee_amount}%`;
      case 2: return `${pos.extra_fee_amount}x`;
      case 3: return `Fixed: ${pos.extra_fee_amount}`;
      default: return 'N/A';
    }
  }

  deleteInvoice(inv: any): void {
    if (inv.status === 'approved') {
      this.dialogService.showMsgDialog('Cannot delete an approved invoice.');
      return;
    }
    this.rest.deleteRecruitingInvoice({ invoiceID: inv.ID }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Invoice deleted', '', 3000);
          this.loadInvoices();
          this.loadOrder();
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }
}
