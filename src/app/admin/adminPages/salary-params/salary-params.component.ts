import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestService } from '../../../services/rest.service';
import { DialogService } from '../../../services/dialog.service';
import { CardComponent, CardContentComponent, CardDescriptionComponent, CardHeaderComponent, CardTitleComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-salary-params',
  standalone: true,
  imports: [
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

  // NBS Exchange Rate
  nbsCurrency = 'EUR';
  nbsDate = '';
  nbsRate: any = null;
  nbsLoading = false;
  nbsError = '';

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit(): void {
    this.loadParams();
    this.fetchNbsRate();
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

  fetchNbsRate() {
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
