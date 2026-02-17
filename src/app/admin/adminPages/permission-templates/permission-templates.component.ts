import {Component, OnInit} from '@angular/core';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {MatDialog} from '@angular/material/dialog';
import {PermissionTemplateDialogComponent} from './permission-template-dialog/permission-template-dialog.component';
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent} from '../../../shared/components/ui/card/card.component';
import {ButtonComponent} from '../../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-permission-templates',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent,
    ButtonComponent
  ],
  templateUrl: './permission-templates.component.html',
  styleUrl: './permission-templates.component.css'
})
export class PermissionTemplatesComponent implements OnInit {

  templates: any[] = [];

  constructor(private rest: RestService, private matDialog: MatDialog, private dialogService: DialogService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates() {
    this.rest.getPermissionTemplates().subscribe(res => {
      if (res.status === 200) {
        this.templates = res.data;
      }
    });
  }

  openCreateDialog() {
    const ref = this.matDialog.open(PermissionTemplateDialogComponent, {
      width: '800px',
      data: {template: null}
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadTemplates();
      }
    });
  }

  openEditDialog(template: any) {
    this.rest.getPermissionTemplateById(template.id).subscribe(res => {
      if (res.status === 200) {
        const ref = this.matDialog.open(PermissionTemplateDialogComponent, {
          width: '800px',
          data: {template: res.data}
        });
        ref.afterClosed().subscribe(result => {
          if (result) {
            this.loadTemplates();
          }
        });
      }
    });
  }

  deleteTemplate(template: any) {
    this.dialogService.showChooseDialog('Are you sure you want to delete this template?').afterClosed().subscribe(isYes => {
      if (isYes) {
        this.rest.deletePermissionTemplate(template.id).subscribe({
          next: result => {
            if (result.status === 200) {
              this.dialogService.showSnackBar('Template deleted', '', 3000);
              this.loadTemplates();
            }
          },
          error: err => {
            this.dialogService.errorServDialog(err);
          }
        });
      }
    });
  }
}
