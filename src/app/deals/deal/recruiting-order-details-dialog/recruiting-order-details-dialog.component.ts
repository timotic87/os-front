import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-recruiting-order-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ButtonComponent,
    BadgeComponent
  ],
  templateUrl: './recruiting-order-details-dialog.component.html',
  styleUrl: './recruiting-order-details-dialog.component.css'
})
export class RecruitingOrderDetailsDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<RecruitingOrderDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { order: any }
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getCurrencySymbol(currencyId: number): string {
    // Simple mapping - extend as needed
    const currencyMap: any = {
      1: 'RSD',
      2: 'EUR',
      3: 'USD'
    };
    return currencyMap[currencyId] || 'RSD';
  }

  getSalaryTypeName(salaryTypeId: number): string {
    const salaryTypeMap: any = {
      1: 'Monthly Gross',
      2: 'Monthly Net',
      3: 'Yearly Gross',
      4: 'Yearly Net'
    };
    return salaryTypeMap[salaryTypeId] || '';
  }

  getFeeTypeName(feeTypeId: number): string {
    const feeTypeMap: any = {
      1: 'Percentage',
      2: 'Multiplier',
      3: 'Fixed fee'
    };
    return feeTypeMap[feeTypeId] || '';
  }
}
