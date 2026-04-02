import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService } from '../../../services/rest.service';
import { DialogService } from '../../../services/dialog.service';
import {
  CardComponent, CardHeaderComponent, CardTitleComponent,
  CardDescriptionComponent, CardContentComponent
} from '../../../shared/components/ui/card/card.component';

@Component({
  selector: 'app-bc-environments',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, CardHeaderComponent,
    CardTitleComponent, CardDescriptionComponent, CardContentComponent],
  templateUrl: './bc-environments.component.html',
})
export class BcEnvironmentsComponent implements OnInit {

  environments: any[] = [];
  loading = false;

  // Form state
  showForm = false;
  editingId: number | null = null;
  saving = false;

  form = {
    name: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    scope: 'https://api.businesscentral.dynamics.com/.default',
    environmentName: '',
    companyId: '',
  };

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.rest.getBcEnvironments().subscribe({
      next: (res: any) => {
        if (res.status === 200) this.environments = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openAdd() {
    this.editingId = null;
    this.form = {
      name: '', tenantId: '', clientId: '', clientSecret: '',
      scope: 'https://api.businesscentral.dynamics.com/.default',
      environmentName: '', companyId: '',
    };
    this.showForm = true;
  }

  openEdit(env: any) {
    this.editingId = env.id;
    this.form = {
      name: env.name,
      tenantId: env.tenantId,
      clientId: env.clientId,
      clientSecret: '',  // blank — only fill to change
      scope: env.scope,
      environmentName: env.environmentName,
      companyId: env.companyId,
    };
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
  }

  save() {
    if (!this.form.name || !this.form.tenantId || !this.form.clientId || !this.form.environmentName || !this.form.companyId) {
      this.dialogService.showMsgDialog('Please fill all required fields.');
      return;
    }
    if (!this.editingId && !this.form.clientSecret) {
      this.dialogService.showMsgDialog('Client Secret is required when creating a new environment.');
      return;
    }
    this.saving = true;

    const obs = this.editingId
      ? this.rest.updateBcEnvironment(this.editingId, this.form)
      : this.rest.createBcEnvironment(this.form);

    obs.subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.status === 200) {
          this.dialogService.showSnackBar(this.editingId ? 'Updated' : 'Created', '', 2500);
          this.showForm = false;
          this.editingId = null;
          this.load();
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.dialogService.errorServDialog(err);
      }
    });
  }

  activate(env: any) {
    if (env.isActive) return;
    const ref = this.dialogService.showChooseDialog(`Activate environment "${env.name}"?`);
    ref.afterClosed().subscribe((ok: any) => {
      if (!ok) return;
      this.rest.activateBcEnvironment(env.id).subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.dialogService.showSnackBar(res.message, '', 3000);
            this.load();
          }
        },
        error: (err: any) => this.dialogService.errorServDialog(err)
      });
    });
  }

  remove(env: any) {
    if (env.isActive) {
      this.dialogService.showMsgDialog('Cannot delete the active environment. Activate another one first.');
      return;
    }
    const ref = this.dialogService.showChooseDialog(`Delete environment "${env.name}"?`);
    ref.afterClosed().subscribe((ok: any) => {
      if (!ok) return;
      this.rest.deleteBcEnvironment(env.id).subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.dialogService.showSnackBar('Deleted', '', 2500);
            this.load();
          }
        },
        error: (err: any) => this.dialogService.errorServDialog(err)
      });
    });
  }
}
