import {Component, OnInit} from '@angular/core';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent} from '../../../shared/components/ui/card/card.component';
import {ButtonComponent} from '../../../shared/components/ui/button/button.component';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-cost-centers',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
    ButtonComponent, FormsModule, NgForOf, NgIf
  ],
  templateUrl: './cost-centers.component.html'
})
export class CostCentersComponent implements OnInit {

  costCenters: any[] = [];
  filteredCostCenters: any[] = [];
  loading = false;

  // Filter
  filterType = '';
  types: string[] = [];

  // Add/Edit form
  formMode: 'add' | 'edit' | null = null;
  form = { id: null as number | null, code: '', name: '', type: 'general', active: true };

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.loadCostCenters();
  }

  loadCostCenters() {
    this.loading = true;
    this.rest.getCostCenters().subscribe({
      next: res => {
        if (res.status === 200) {
          this.costCenters = res.data;
          this.extractTypes();
          this.applyFilter();
        }
        this.loading = false;
      },
      error: err => {
        this.dialogService.errorServDialog(err);
        this.loading = false;
      }
    });
  }

  extractTypes() {
    const typeSet = new Set(this.costCenters.map(cc => cc.type));
    this.types = Array.from(typeSet).sort();
  }

  applyFilter() {
    if (this.filterType) {
      this.filteredCostCenters = this.costCenters.filter(cc => cc.type === this.filterType);
    } else {
      this.filteredCostCenters = [...this.costCenters];
    }
  }

  showAddForm() {
    this.formMode = 'add';
    this.form = { id: null, code: '', name: '', type: 'general', active: true };
  }

  editCostCenter(cc: any) {
    this.formMode = 'edit';
    this.form = {
      id: cc.ID,
      code: cc.code,
      name: cc.name,
      type: cc.type,
      active: cc.active
    };
  }

  cancelForm() {
    this.formMode = null;
    this.form = { id: null, code: '', name: '', type: 'general', active: true };
  }

  save() {
    if (!this.form.code.trim() || !this.form.name.trim()) {
      this.dialogService.showSnackBar('Code and name are required', '', 3000);
      return;
    }

    if (this.formMode === 'add') {
      this.rest.createCostCenter(this.form).subscribe({
        next: res => {
          if (res.status === 201) {
            this.dialogService.showSnackBar('Cost center created', '', 3000);
            this.cancelForm();
            this.loadCostCenters();
          }
        },
        error: err => this.dialogService.errorServDialog(err)
      });
    } else if (this.formMode === 'edit') {
      this.rest.updateCostCenter(this.form).subscribe({
        next: res => {
          if (res.status === 200) {
            this.dialogService.showSnackBar('Cost center updated', '', 3000);
            this.cancelForm();
            this.loadCostCenters();
          }
        },
        error: err => this.dialogService.errorServDialog(err)
      });
    }
  }

  toggleActive(cc: any) {
    const action = cc.active ? 'deactivate' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${cc.name}"?`)) return;

    this.rest.deleteCostCenter(cc.ID).subscribe({
      next: res => {
        if (res.status === 200) {
          this.dialogService.showSnackBar(`Cost center ${action}d`, '', 3000);
          this.loadCostCenters();
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }
}
