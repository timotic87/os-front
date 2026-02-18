import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { RestService } from '../services/rest.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-salary-calculator-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-h-[85vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <svg class="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-foreground">Salary Calculator</h2>
            <p class="text-xs text-muted-foreground">Net / Gross / Grand Gross conversion</p>
          </div>
        </div>
        <button (click)="close()" class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Input -->
      <div class="flex items-end gap-3 flex-wrap mb-5">
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">Salary Type</label>
          <select [(ngModel)]="calcSalaryTypeId"
                  class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            @for (st of salaryTypes; track st.ID) {
              <option [ngValue]="st.ID">{{ st.name }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
          <input type="number" [(ngModel)]="calcAmount" placeholder="e.g. 100000" step="0.01"
                 (keyup.enter)="calculate()"
                 class="w-40 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
          <select [(ngModel)]="calcCurrency"
                  class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            @for (c of currencies; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>
        <button (click)="calculate()" [disabled]="loading || !calcAmount"
                class="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50">
          @if (loading) {
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          }
          Calculate
        </button>
      </div>

      @if (error) {
        <div class="mb-4 px-3 py-2 rounded-md bg-destructive/10 text-destructive text-sm">{{ error }}</div>
      }

      @if (result) {
        <!-- Results Table -->
        <div class="overflow-x-auto mb-4">
          <table class="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead>
              <tr class="bg-muted/50">
                <th class="text-left px-3 py-2 font-medium text-muted-foreground border-b border-border">Salary Type</th>
                @for (cur of currencies; track cur) {
                  <th class="text-right px-3 py-2 font-medium text-muted-foreground border-b border-border">{{ cur }}</th>
                }
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border hover:bg-muted/30">
                <td class="px-3 py-1.5 text-foreground">Monthly Net</td>
                @for (cur of currencies; track cur) {
                  <td class="text-right px-3 py-1.5 font-mono text-foreground">{{ result.results[cur].monthlyNet | number:'1.2-2' }}</td>
                }
              </tr>
              <tr class="border-b border-border hover:bg-muted/30">
                <td class="px-3 py-1.5 text-foreground">Monthly Base Gross</td>
                @for (cur of currencies; track cur) {
                  <td class="text-right px-3 py-1.5 font-mono text-foreground">{{ result.results[cur].monthlyGross | number:'1.2-2' }}</td>
                }
              </tr>
              <tr class="border-b border-border hover:bg-muted/30">
                <td class="px-3 py-1.5 text-foreground font-medium">Monthly Grand Gross</td>
                @for (cur of currencies; track cur) {
                  <td class="text-right px-3 py-1.5 font-mono text-foreground font-medium">{{ result.results[cur].monthlyGrandGross | number:'1.2-2' }}</td>
                }
              </tr>
              <tr class="border-b border-border bg-muted/20 hover:bg-muted/30">
                <td class="px-3 py-1.5 text-foreground">Annual Net</td>
                @for (cur of currencies; track cur) {
                  <td class="text-right px-3 py-1.5 font-mono text-foreground">{{ result.results[cur].annualNet | number:'1.2-2' }}</td>
                }
              </tr>
              <tr class="border-b border-border bg-muted/20 hover:bg-muted/30">
                <td class="px-3 py-1.5 text-foreground">Annual Base Gross</td>
                @for (cur of currencies; track cur) {
                  <td class="text-right px-3 py-1.5 font-mono text-foreground">{{ result.results[cur].annualGross | number:'1.2-2' }}</td>
                }
              </tr>
              <tr class="bg-muted/20 hover:bg-muted/30">
                <td class="px-3 py-1.5 text-foreground font-medium">Annual Grand Gross</td>
                @for (cur of currencies; track cur) {
                  <td class="text-right px-3 py-1.5 font-mono text-foreground font-medium">{{ result.results[cur].annualGrandGross | number:'1.2-2' }}</td>
                }
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Breakdown -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div class="p-3 rounded-lg border border-border bg-muted/30">
            <h4 class="text-xs font-medium text-foreground mb-2">Monthly Breakdown (RSD)</h4>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between"><span class="text-muted-foreground">Gross Salary</span><span class="font-mono text-foreground">{{ result.breakdown.monthlyGross | number:'1.2-2' }}</span></div>
              <div class="flex justify-between text-destructive/80"><span>- Income Tax ({{ result.params.incomeTax }}%)</span><span class="font-mono">{{ result.breakdown.tax | number:'1.2-2' }}</span></div>
              <div class="flex justify-between text-destructive/80"><span>- PIO Employee ({{ result.params.pensionContributionEmployee }}%)</span><span class="font-mono">{{ result.breakdown.pioEmployee | number:'1.2-2' }}</span></div>
              <div class="flex justify-between text-destructive/80"><span>- Health Employee ({{ result.params.healthContributionEmployee }}%)</span><span class="font-mono">{{ result.breakdown.healthEmployee | number:'1.2-2' }}</span></div>
              <div class="flex justify-between text-destructive/80"><span>- Unemployment ({{ result.params.unemploymentContributionEmployee }}%)</span><span class="font-mono">{{ result.breakdown.unemploymentEmployee | number:'1.2-2' }}</span></div>
              <div class="border-t border-border pt-1 flex justify-between font-medium"><span class="text-foreground">= Net Salary</span><span class="font-mono text-foreground">{{ result.breakdown.monthlyNet | number:'1.2-2' }}</span></div>
            </div>
          </div>
          <div class="p-3 rounded-lg border border-border bg-muted/30">
            <h4 class="text-xs font-medium text-foreground mb-2">Employer Cost (RSD)</h4>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between"><span class="text-muted-foreground">Gross Salary</span><span class="font-mono text-foreground">{{ result.breakdown.monthlyGross | number:'1.2-2' }}</span></div>
              <div class="flex justify-between text-blue-500"><span>+ PIO Employer ({{ result.params.pensionOnBehalfOfEmployer }}%)</span><span class="font-mono">{{ result.breakdown.pioEmployer | number:'1.2-2' }}</span></div>
              <div class="flex justify-between text-blue-500"><span>+ Health Employer ({{ result.params.healthOnBehalfOfEmployer }}%)</span><span class="font-mono">{{ result.breakdown.healthEmployer | number:'1.2-2' }}</span></div>
              <div class="border-t border-border pt-1 flex justify-between font-medium"><span class="text-foreground">= Grand Gross</span><span class="font-mono text-foreground">{{ result.breakdown.monthlyGrandGross | number:'1.2-2' }}</span></div>
              <div class="mt-1.5 pt-1.5 border-t border-border text-[10px] text-muted-foreground">
                <div>Contribution base: {{ result.breakdown.contributionBase | number:'1.2-2' }} RSD</div>
                <div>Tax reimburse: {{ result.params.taxReimburse | number:'1.2-2' }} RSD | Max base: {{ result.params.maximumBaseForTax | number:'1.2-2' }} RSD</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Exchange Rates + Export -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Rates:</span>
            <span class="font-mono">1 EUR = {{ result.exchangeRates.EUR }} RSD</span>
            <span class="font-mono">1 USD = {{ result.exchangeRates.USD }} RSD</span>
          </div>
          <button (click)="exportToExcel()"
                  class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export Excel
          </button>
        </div>
      }
    </div>
  `
})
export class SalaryCalculatorDialogComponent implements OnInit {

  salaryTypes: any[] = [];
  calcSalaryTypeId = 0;
  calcAmount = 0;
  calcCurrency = 'RSD';
  currencies = ['RSD', 'EUR', 'USD'];
  result: any = null;
  loading = false;
  error = '';

  constructor(
    private dialogRef: MatDialogRef<SalaryCalculatorDialogComponent>,
    private rest: RestService
  ) {}

  ngOnInit() {
    this.rest.getSalaryTypes().subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.salaryTypes = res.data;
          if (this.salaryTypes.length > 0) {
            this.calcSalaryTypeId = this.salaryTypes[0].ID;
          }
        }
      }
    });
  }

  calculate() {
    if (!this.calcAmount || !this.calcSalaryTypeId) return;
    this.loading = true;
    this.error = '';
    this.result = null;
    this.rest.calculateSalary({
      amount: this.calcAmount,
      salaryTypeId: this.calcSalaryTypeId,
      currency: this.calcCurrency
    }).subscribe({
      next: (res: any) => {
        if (res.status === 200) this.result = res.data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Calculation failed';
        this.loading = false;
      }
    });
  }

  exportToExcel() {
    if (!this.result) return;
    const r = this.result;
    const bd = r.breakdown;
    const p = r.params;
    const inputType = this.salaryTypes.find((t: any) => t.ID === this.calcSalaryTypeId);

    const overviewData = [
      ['Salary Calculation', '', '', ''],
      ['', '', '', ''],
      ['Input', '', '', ''],
      ['Type', inputType?.name || '', '', ''],
      ['Amount', this.calcAmount, '', ''],
      ['Currency', this.calcCurrency, '', ''],
      ['Date', new Date().toLocaleDateString('sr-RS'), '', ''],
      ['', '', '', ''],
      ['Salary Type', 'RSD', 'EUR', 'USD'],
      ['Monthly Net', r.results.RSD.monthlyNet, r.results.EUR.monthlyNet, r.results.USD.monthlyNet],
      ['Monthly Base Gross', r.results.RSD.monthlyGross, r.results.EUR.monthlyGross, r.results.USD.monthlyGross],
      ['Monthly Grand Gross (Gross II)', r.results.RSD.monthlyGrandGross, r.results.EUR.monthlyGrandGross, r.results.USD.monthlyGrandGross],
      ['', '', '', ''],
      ['Annual Net', r.results.RSD.annualNet, r.results.EUR.annualNet, r.results.USD.annualNet],
      ['Annual Base Gross', r.results.RSD.annualGross, r.results.EUR.annualGross, r.results.USD.annualGross],
      ['Annual Grand Gross (Gross II)', r.results.RSD.annualGrandGross, r.results.EUR.annualGrandGross, r.results.USD.annualGrandGross],
    ];

    const breakdownData = [
      ['Monthly Breakdown (RSD)', ''],
      ['', ''],
      ['Gross Salary', bd.monthlyGross],
      [`- Income Tax (${p.incomeTax}%)`, bd.tax],
      [`- PIO Employee (${p.pensionContributionEmployee}%)`, bd.pioEmployee],
      [`- Health Employee (${p.healthContributionEmployee}%)`, bd.healthEmployee],
      [`- Unemployment (${p.unemploymentContributionEmployee}%)`, bd.unemploymentEmployee],
      ['= Net Salary', bd.monthlyNet],
      ['', ''],
      ['Employer Cost', ''],
      ['Gross Salary', bd.monthlyGross],
      [`+ PIO Employer (${p.pensionOnBehalfOfEmployer}%)`, bd.pioEmployer],
      [`+ Health Employer (${p.healthOnBehalfOfEmployer}%)`, bd.healthEmployer],
      ['= Grand Gross (Gross II)', bd.monthlyGrandGross],
      ['', ''],
      ['Parameters', ''],
      ['Contribution base', bd.contributionBase],
      ['Tax reimburse', p.taxReimburse],
      ['Max base for contributions', p.maximumBaseForTax],
      ['', ''],
      ['Exchange Rates', ''],
      ['1 EUR', `${r.exchangeRates.EUR} RSD`],
      ['1 USD', `${r.exchangeRates.USD} RSD`],
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
    ws1['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Salary Overview');
    const ws2 = XLSX.utils.aoa_to_sheet(breakdownData);
    ws2['!cols'] = [{ wch: 40 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Breakdown');
    XLSX.writeFile(wb, `Salary_Calculation_${this.calcAmount}_${this.calcCurrency}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  close() {
    this.dialogRef.close();
  }
}
