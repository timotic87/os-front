import {Component, OnInit} from '@angular/core';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent} from '../../../shared/components/ui/card/card.component';
import {ButtonComponent} from '../../../shared/components/ui/button/button.component';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
    ButtonComponent, FormsModule, NgForOf, NgIf
  ],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

  settings: any[] = [];
  loading = false;

  // Add/Edit form
  formMode: 'add' | 'edit' | null = null;
  form = { key: '', value: '', description: '', value_type: 'string' };

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.rest.getSettings().subscribe({
      next: res => {
        if (res.status === 200) {
          this.settings = res.data;
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
    this.form = { key: '', value: '', description: '', value_type: 'string' };
  }

  editSetting(s: any) {
    this.formMode = 'edit';
    this.form = {
      key: s.key,
      value: s.value,
      description: s.description || '',
      value_type: s.value_type || 'string'
    };
  }

  cancelForm() {
    this.formMode = null;
    this.form = { key: '', value: '', description: '', value_type: 'string' };
  }

  save() {
    if (!this.form.key.trim() || !this.form.value.trim()) {
      this.dialogService.showSnackBar('Key and value are required', '', 3000);
      return;
    }

    this.rest.upsertSetting(this.form).subscribe({
      next: res => {
        if (res.status === 200 || res.status === 201) {
          this.dialogService.showSnackBar(res.message || 'Setting saved', '', 3000);
          this.cancelForm();
          this.loadSettings();
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }
}
