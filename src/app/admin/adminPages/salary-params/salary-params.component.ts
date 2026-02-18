import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RestService } from '../../../services/rest.service';
import { DialogService } from '../../../services/dialog.service';
import * as XLSX from 'xlsx';
import { CardComponent, CardContentComponent, CardDescriptionComponent, CardHeaderComponent, CardTitleComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-salary-params',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent, CardContentComponent, CardDescriptionComponent, CardHeaderComponent, CardTitleComponent,
    ButtonComponent
  ],
  templateUrl: './salary-params.component.html'
})
export class SalaryParamsComponent implements OnInit {

  params: any = {
    incomeTax: 0,
    pensionContributionEmployee: 0,
    healthContributionEmployee: 0,
    unemploymentContributionEmployee: 0,
    pensionOnBehalfOfEmployer: 0,
    healthOnBehalfOfEmployer: 0,
    taxReimburse: 0,
    maximumBaseForTax: 0
  };

  loading = true;
  saving = false;

  // Currencies
  currencies: any[] = [];
  currenciesLoading = true;
  showAddCurrency = false;
  addingCurrency = false;
  newCurrency = { code: '', name: '', nbsCode: 0 };

  // NBS Exchange Rate
  nbsCurrency = 'EUR';
  nbsDate = '';
  nbsRate: any = null;
  nbsLoading = false;
  nbsError = '';

  // Salary Calculator
  salaryTypes: any[] = [];
  calcSalaryTypeId: number = 0;
  calcAmount: number = 0;
  calcCurrency: string = 'RSD';
  calcResult: any = null;
  calcLoading = false;
  calcError = '';
  calcCurrencies = ['RSD', 'EUR', 'USD'];

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit(): void {
    this.loadParams();
    this.loadCurrencies();
    this.loadSalaryTypes();
  }

  loadParams() {
    this.loading = true;
    this.rest.getSalaryParams().subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data?.length > 0) {
          this.params = { ...res.data[0] };
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  save() {
    this.saving = true;
    this.rest.updateSalaryParams(this.params).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.params = { ...res.data };
          this.dialogService.showSnackBar('Salary parameters saved', '', 3000);
        }
        this.saving = false;
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
        this.saving = false;
      }
    });
  }

  // --- Currencies ---
  loadCurrencies() {
    this.currenciesLoading = true;
    this.rest.getCurrencyList(false).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.currencies = res.data;
        }
        this.currenciesLoading = false;
        this.fetchNbsRate();
      },
      error: () => {
        this.currenciesLoading = false;
      }
    });
  }

  get activeCurrencies() {
    return this.currencies.filter(c => c.active);
  }

  toggleActive(currency: any) {
    const newActive = !currency.active;
    this.rest.toggleCurrencyActive(currency.ID, newActive).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.currencies = res.data;
        }
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
      }
    });
  }

  addCurrency() {
    if (!this.newCurrency.code || !this.newCurrency.name) return;
    this.addingCurrency = true;
    this.rest.addCurrency({
      code: this.newCurrency.code.toUpperCase(),
      name: this.newCurrency.name,
      nbsCode: this.newCurrency.nbsCode || 0
    }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.currencies = res.data;
          this.newCurrency = { code: '', name: '', nbsCode: 0 };
          this.showAddCurrency = false;
          this.dialogService.showSnackBar('Currency added', '', 3000);
        }
        this.addingCurrency = false;
      },
      error: (err: any) => {
        this.dialogService.errorServDialog(err);
        this.addingCurrency = false;
      }
    });
  }

  // --- Salary Calculator ---
  loadSalaryTypes() {
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

  calculateSalary() {
    if (!this.calcAmount || !this.calcSalaryTypeId) return;
    this.calcLoading = true;
    this.calcError = '';
    this.calcResult = null;
    this.rest.calculateSalary({
      amount: this.calcAmount,
      salaryTypeId: this.calcSalaryTypeId,
      currency: this.calcCurrency
    }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.calcResult = res.data;
        }
        this.calcLoading = false;
      },
      error: (err: any) => {
        this.calcError = err.error?.message || 'Calculation failed';
        this.calcLoading = false;
      }
    });
  }

  exportToExcel() {
    if (!this.calcResult) return;
    const r = this.calcResult;
    const bd = r.breakdown;
    const p = r.params;

    // Find input type name
    const inputType = this.salaryTypes.find((t: any) => t.ID === this.calcSalaryTypeId);
    const inputTypeName = inputType?.name || '';

    // Sheet 1: Salary Overview
    const overviewData = [
      ['Salary Calculation', '', '', ''],
      ['', '', '', ''],
      ['Input', '', '', ''],
      ['Type', inputTypeName, '', ''],
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

    // Sheet 2: Breakdown
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
      ['Tax reimburse (neoporezivi iznos)', p.taxReimburse],
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

    const fileName = `Salary_Calculation_${this.calcAmount}_${this.calcCurrency}_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // --- NBS ---
  fetchNbsRate() {
    if (!this.nbsCurrency) return;
    this.nbsLoading = true;
    this.nbsError = '';
    this.nbsRate = null;
    this.rest.getNbsMiddleRate(this.nbsCurrency, this.nbsDate || undefined).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.nbsRate = res.data;
        }
        this.nbsLoading = false;
      },
      error: (err: any) => {
        this.nbsError = err.error?.message || 'Failed to fetch rate from NBS';
        this.nbsLoading = false;
      }
    });
  }
}
