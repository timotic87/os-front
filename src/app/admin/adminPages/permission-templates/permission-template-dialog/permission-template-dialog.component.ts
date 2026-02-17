import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {RestService} from '../../../../services/rest.service';
import {DialogService} from '../../../../services/dialog.service';
import {FormsModule} from '@angular/forms';
import {NgForOf} from '@angular/common';
import {ButtonComponent} from '../../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-permission-template-dialog',
  standalone: true,
  imports: [FormsModule, NgForOf, ButtonComponent],
  templateUrl: './permission-template-dialog.component.html',
  styleUrl: './permission-template-dialog.component.css'
})
export class PermissionTemplateDialogComponent implements OnInit {

  name = '';
  description = '';
  sections: { sectionName: string; permissions: { id: number; name: string; checked: boolean }[] }[] = [];
  isEdit = false;
  templateId: number | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private rest: RestService,
    private dialogRef: MatDialogRef<PermissionTemplateDialogComponent>,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    if (this.data.template) {
      this.isEdit = true;
      this.templateId = this.data.template.id;
      this.name = this.data.template.name;
      this.description = this.data.template.description || '';
    }
    this.loadPermissions();
  }

  loadPermissions() {
    // Use getUserPermissions with a dummy userId (0) to get all permissions
    // The query returns all permissions with LEFT JOIN, so userId=0 means all have userId=null
    this.rest.getUserPermissions(0).subscribe(res => {
      if (res.status === 200) {
        const selectedIds = this.data.template?.permissionIds || [];
        const grouped: Record<string, { sectionName: string; permissions: any[] }> = {};

        for (const perm of res.data) {
          const section = perm.sectionName || 'Other';
          if (!grouped[section]) {
            grouped[section] = {sectionName: section, permissions: []};
          }
          grouped[section].permissions.push({
            id: perm.id,
            name: perm.name,
            checked: selectedIds.includes(perm.id)
          });
        }

        this.sections = Object.values(grouped);
      }
    });
  }

  getSelectedIds(): number[] {
    const ids: number[] = [];
    for (const section of this.sections) {
      for (const perm of section.permissions) {
        if (perm.checked) {
          ids.push(perm.id);
        }
      }
    }
    return ids;
  }

  onSubmit() {
    if (!this.name.trim()) {
      this.dialogService.showMsgDialog('Template name is required');
      return;
    }

    const payload = {
      name: this.name.trim(),
      description: this.description.trim(),
      permissionIds: this.getSelectedIds()
    };

    this.dialogService.showLoader();

    if (this.isEdit) {
      this.rest.updatePermissionTemplate(this.templateId, payload).subscribe({
        next: res => {
          this.dialogService.closeLoader();
          if (res.status === 200) {
            this.dialogService.showSnackBar('Template updated', '', 3000);
            this.dialogRef.close(true);
          }
        },
        error: err => {
          this.dialogService.closeLoader();
          this.dialogService.errorServDialog(err);
        }
      });
    } else {
      this.rest.createPermissionTemplate(payload).subscribe({
        next: res => {
          this.dialogService.closeLoader();
          if (res.status === 201) {
            this.dialogService.showSnackBar('Template created', '', 3000);
            this.dialogRef.close(true);
          }
        },
        error: err => {
          this.dialogService.closeLoader();
          this.dialogService.errorServDialog(err);
        }
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  toggleAll(section: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    for (const perm of section.permissions) {
      perm.checked = checked;
    }
  }

  isAllChecked(section: any): boolean {
    return section.permissions.every(p => p.checked);
  }
}
