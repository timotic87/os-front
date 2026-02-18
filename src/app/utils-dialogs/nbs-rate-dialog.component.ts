import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-nbs-rate-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <svg class="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-foreground">NBS Exchange Rate</h2>
            <p class="text-xs text-muted-foreground">Official middle rate from National Bank of Serbia</p>
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
          <label class="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
          <select [(ngModel)]="selectedCurrency"
                  class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            @for (c of allCurrencies; track c.ID) {
              @if (c.code !== 'RSD') {
                <option [value]="c.code">{{ c.code }} - {{ c.name }}</option>
              }
            }
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">Date (optional)</label>
          <input type="text" [(ngModel)]="rateDate" placeholder="dd.MM.yyyy"
                 (keyup.enter)="fetchRate()"
                 class="w-36 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <button (click)="fetchRate()" [disabled]="loading || !selectedCurrency"
                class="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
          @if (loading) {
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          } @else {
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          }
          Fetch Rate
        </button>
      </div>

      @if (error) {
        <div class="mb-4 px-3 py-2 rounded-md bg-destructive/10 text-destructive text-sm">{{ error }}</div>
      }

      @if (rate) {
        <div class="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ rate.currencyCode }}</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-foreground font-mono">{{ rate.middleRate }}</div>
            <div class="text-xs text-muted-foreground">RSD per 1 {{ rate.currencyCode }}</div>
          </div>
          @if (rate.date) {
            <div class="ml-auto text-xs text-muted-foreground">{{ rate.date }}</div>
          }
        </div>
      }

      <!-- Quick rates -->
      @if (quickRates.length > 0) {
        <div class="mt-5">
          <h4 class="text-xs font-medium text-muted-foreground mb-2">Common rates (today)</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            @for (qr of quickRates; track qr.currencyCode) {
              <div class="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                <span class="text-sm font-semibold text-foreground">{{ qr.currencyCode }}</span>
                <span class="text-sm font-mono text-foreground">{{ qr.middleRate }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class NbsRateDialogComponent implements OnInit {

  allCurrencies: any[] = [];
  selectedCurrency = 'EUR';
  rateDate = '';
  rate: any = null;
  loading = false;
  error = '';
  quickRates: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<NbsRateDialogComponent>,
    private rest: RestService
  ) {}

  ngOnInit() {
    // Load ALL currencies (not just active)
    this.rest.getCurrencyList(false).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.allCurrencies = res.data;
        }
        this.fetchRate();
        this.loadQuickRates();
      }
    });
  }

  fetchRate() {
    if (!this.selectedCurrency) return;
    this.loading = true;
    this.error = '';
    this.rate = null;
    this.rest.getNbsMiddleRate(this.selectedCurrency, this.rateDate || undefined).subscribe({
      next: (res: any) => {
        if (res.status === 200) this.rate = res.data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to fetch rate from NBS';
        this.loading = false;
      }
    });
  }

  loadQuickRates() {
    const quickCurrencies = ['EUR', 'USD', 'CHF', 'GBP'];
    for (const code of quickCurrencies) {
      this.rest.getNbsMiddleRate(code).subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.quickRates = [...this.quickRates, res.data].sort((a, b) =>
              quickCurrencies.indexOf(a.currencyCode) - quickCurrencies.indexOf(b.currencyCode)
            );
          }
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
