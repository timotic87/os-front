import {Component, OnInit} from '@angular/core';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent} from '../../../shared/components/ui/card/card.component';
import {ButtonComponent} from '../../../shared/components/ui/button/button.component';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
    ButtonComponent, FormsModule
  ],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

  settings: any[] = [];
  loading = false;

  // Add/Edit form
  formMode: 'add' | 'edit' | null = null;
  form = { key: '', value: '', description: '', value_type: 'string' };

  // Invoice sequence per legal entity
  seqInfo: any[] = [];
  seqLoading = false;
  editingSeq: { [key: string]: number | null } = {};
  savingSeq: { [key: string]: boolean } = {};
  currentYearShort = String(new Date().getFullYear()).slice(-2);

  // BC Environments
  bcEnvs: any[] = [];
  bcEnvsLoading = false;
  showBcForm = false;
  bcEditingId: number | null = null;
  bcSaving = false;
  bcForm = {
    name: '', tenantId: '', clientId: '', clientSecret: '',
    scope: 'https://api.businesscentral.dynamics.com/.default',
    environmentName: '', companyId: '',
  };

  padSeq(n: number): string {
    return String(n).padStart(4, '0');
  }

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.loadSettings();
    this.loadSeqInfo();
    this.loadBcEnvs();
  }

  loadSeqInfo() {
    this.seqLoading = true;
    this.rest.getInvoiceSeqInfo().subscribe({
      next: res => {
        if (res.status === 200) this.seqInfo = res.data;
        this.seqLoading = false;
      },
      error: err => {
        this.dialogService.errorServDialog(err);
        this.seqLoading = false;
      }
    });
  }

  saveSeqFloor(le: any, type: 'inv' | 'ko' | 'kz') {
    const key = `${le.legalEntityId}_${type}`;
    const floor = this.editingSeq[key];
    if (floor === null || floor === undefined || isNaN(Number(floor))) {
      this.dialogService.showSnackBar('Enter a valid number', '', 3000);
      return;
    }
    const settingKeyMap = {
      inv: `invoice_seq_floor_${le.legalEntityId}`,
      ko:  `note_seq_floor_ko_${le.legalEntityId}`,
      kz:  `note_seq_floor_kz_${le.legalEntityId}`,
    };
    const labelMap = { inv: 'Invoice', ko: 'KO', kz: 'KZ' };
    this.savingSeq[key] = true;
    this.rest.upsertSetting({
      key: settingKeyMap[type],
      value: String(floor),
      description: `${labelMap[type]} sequence floor for ${le.legalEntityName}`,
      value_type: 'number'
    }).subscribe({
      next: res => {
        this.savingSeq[key] = false;
        if (res.status === 200 || res.status === 201) {
          this.dialogService.showSnackBar(`${labelMap[type]} floor set to ${floor} for ${le.legalEntityName}`, '', 3000);
          this.editingSeq[key] = null;
          this.loadSeqInfo();
        }
      },
      error: err => {
        this.savingSeq[key] = false;
        this.dialogService.errorServDialog(err);
      }
    });
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

  // --- BC Environments ---

  loadBcEnvs() {
    this.bcEnvsLoading = true;
    this.rest.getBcEnvironments().subscribe({
      next: res => {
        if (res.status === 200) this.bcEnvs = res.data;
        this.bcEnvsLoading = false;
      },
      error: () => { this.bcEnvsLoading = false; }
    });
  }

  openAddBcEnv() {
    this.bcEditingId = null;
    this.bcForm = {
      name: '', tenantId: '', clientId: '', clientSecret: '',
      scope: 'https://api.businesscentral.dynamics.com/.default',
      environmentName: '', companyId: '',
    };
    this.showBcForm = true;
  }

  openEditBcEnv(env: any) {
    this.bcEditingId = env.id;
    this.bcForm = {
      name: env.name, tenantId: env.tenantId, clientId: env.clientId,
      clientSecret: '', scope: env.scope,
      environmentName: env.environmentName, companyId: env.companyId,
    };
    this.showBcForm = true;
  }

  cancelBcForm() {
    this.showBcForm = false;
    this.bcEditingId = null;
  }

  saveBcEnv() {
    if (!this.bcForm.name || !this.bcForm.tenantId || !this.bcForm.clientId || !this.bcForm.environmentName || !this.bcForm.companyId) {
      this.dialogService.showMsgDialog('Please fill all required fields.');
      return;
    }
    if (!this.bcEditingId && !this.bcForm.clientSecret) {
      this.dialogService.showMsgDialog('Client Secret is required.');
      return;
    }
    this.bcSaving = true;
    const obs = this.bcEditingId
      ? this.rest.updateBcEnvironment(this.bcEditingId, this.bcForm)
      : this.rest.createBcEnvironment(this.bcForm);

    obs.subscribe({
      next: res => {
        this.bcSaving = false;
        if (res.status === 200) {
          this.dialogService.showSnackBar(this.bcEditingId ? 'Updated' : 'Created', '', 2500);
          this.cancelBcForm();
          this.loadBcEnvs();
        }
      },
      error: err => { this.bcSaving = false; this.dialogService.errorServDialog(err); }
    });
  }

  activateBcEnv(env: any) {
    if (env.isActive) return;
    const ref = this.dialogService.showChooseDialog(`Activate environment "${env.name}"?`);
    ref.afterClosed().subscribe((ok: any) => {
      if (!ok) return;
      this.rest.activateBcEnvironment(env.id).subscribe({
        next: res => {
          if (res.status === 200) {
            this.dialogService.showSnackBar(res.message, '', 3000);
            this.loadBcEnvs();
          }
        },
        error: err => this.dialogService.errorServDialog(err)
      });
    });
  }

  removeBcEnv(env: any) {
    if (env.isActive) {
      this.dialogService.showMsgDialog('Cannot delete the active environment.');
      return;
    }
    const ref = this.dialogService.showChooseDialog(`Delete "${env.name}"?`);
    ref.afterClosed().subscribe((ok: any) => {
      if (!ok) return;
      this.rest.deleteBcEnvironment(env.id).subscribe({
        next: res => {
          if (res.status === 200) {
            this.dialogService.showSnackBar('Deleted', '', 2500);
            this.loadBcEnvs();
          }
        },
        error: err => this.dialogService.errorServDialog(err)
      });
    });
  }
}
