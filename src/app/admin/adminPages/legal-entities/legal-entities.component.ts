import {Component, OnInit} from '@angular/core';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent} from '../../../shared/components/ui/card/card.component';
import {ButtonComponent} from '../../../shared/components/ui/button/button.component';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf, DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-legal-entities',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
    ButtonComponent, FormsModule, NgForOf, NgIf, DecimalPipe
  ],
  templateUrl: './legal-entities.component.html'
})
export class LegalEntitiesComponent implements OnInit {

  entities: any[] = [];
  filteredEntities: any[] = [];
  loading = false;

  searchText = '';
  filterStatus = '';

  // Add/Edit form
  formMode: 'add' | 'edit' | null = null;
  form = { id: null as number | null, name: '', shortName: '', bcCompanyId: '', franchise_fee: null as number | null };

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.loadEntities();
  }

  applyFilter() {
    let result = [...this.entities];
    if (this.filterStatus === 'active') {
      result = result.filter(e => e.isActive);
    } else if (this.filterStatus === 'inactive') {
      result = result.filter(e => !e.isActive);
    }
    if (this.searchText.trim()) {
      const s = this.searchText.trim().toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(s) ||
        (e.shortName || '').toLowerCase().includes(s) ||
        (e.bcCompanyId || '').toLowerCase().includes(s)
      );
    }
    this.filteredEntities = result;
  }

  loadEntities() {
    this.loading = true;
    this.rest.getLEListAll().subscribe({
      next: res => {
        if (res.status === 200) {
          this.entities = res.data;
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

  showAddForm() {
    this.formMode = 'add';
    this.form = { id: null, name: '', shortName: '', bcCompanyId: '', franchise_fee: null };
  }

  editEntity(entity: any) {
    this.formMode = 'edit';
    this.form = {
      id: entity.id,
      name: entity.name,
      shortName: entity.shortName || '',
      bcCompanyId: entity.bcCompanyId || '',
      franchise_fee: entity.franchise_fee
    };
  }

  cancelForm() {
    this.formMode = null;
    this.form = { id: null, name: '', shortName: '', bcCompanyId: '', franchise_fee: null };
  }

  save() {
    if (!this.form.name.trim()) {
      this.dialogService.showSnackBar('Name is required', '', 3000);
      return;
    }

    if (this.formMode === 'add') {
      this.rest.createLegalEntity(this.form).subscribe({
        next: res => {
          if (res.status === 201) {
            this.dialogService.showSnackBar('Legal entity created', '', 3000);
            this.cancelForm();
            this.loadEntities();
          }
        },
        error: err => this.dialogService.errorServDialog(err)
      });
    } else if (this.formMode === 'edit') {
      this.rest.updateLegalEntity(this.form).subscribe({
        next: res => {
          if (res.status === 200) {
            this.dialogService.showSnackBar('Legal entity updated', '', 3000);
            this.cancelForm();
            this.loadEntities();
          }
        },
        error: err => this.dialogService.errorServDialog(err)
      });
    }
  }

  toggleActive(entity: any) {
    const action = entity.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${entity.name}"?`)) return;

    this.rest.toggleLegalEntityActive(entity.id).subscribe({
      next: res => {
        if (res.status === 200) {
          entity.isActive = !entity.isActive;
          this.applyFilter();
          this.dialogService.showSnackBar(`Legal entity ${action}d`, '', 3000);
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }
}
