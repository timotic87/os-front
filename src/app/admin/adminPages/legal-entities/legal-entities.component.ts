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
  loading = false;

  // Add/Edit form
  formMode: 'add' | 'edit' | null = null;
  form = { id: null as number | null, name: '', shortName: '', bcCompanyId: '', franchise_fee: null as number | null };

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.loadEntities();
  }

  loadEntities() {
    this.loading = true;
    this.rest.getLEList().subscribe({
      next: res => {
        if (res.status === 200) {
          this.entities = res.data;
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

  deleteEntity(entity: any) {
    if (!window.confirm(`Delete "${entity.name}"? This cannot be undone.`)) return;

    this.rest.deleteLegalEntity(entity.id).subscribe({
      next: res => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Legal entity deleted', '', 3000);
          this.loadEntities();
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }
}
