import { Component } from '@angular/core';
import {RestService} from "../../../services/rest.service";
import {MatDialog} from "@angular/material/dialog";
import {ApprovalViewEditDialogComponent} from "./approval-view-edit-dialog/approval-view-edit-dialog.component";
import {ApprovalService} from "../../../services/approval.service";
import {DialogService} from "../../../services/dialog.service";
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent} from '../../../shared/components/ui/card/card.component';
import {FormsModule} from '@angular/forms';
import {NgIf, NgFor} from '@angular/common';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent,
    FormsModule, NgIf, NgFor
  ],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css'
})
export class ApprovalsComponent {

  approvals: any[] = [];
  filteredApprovals: any[] = [];
  searchText = '';

  // Create form state
  showCreateForm = false;
  newName = '';
  newDescription = '';
  newIsSequential = true;

  constructor(
    private rest: RestService,
    private matDialog: MatDialog,
    public approvalService: ApprovalService,
    private dialogService: DialogService
  ) {
    this.loadApprovals();

    approvalService.updateApprovalTemplteSubject.subscribe(appTemp=>{
      const index = this.approvals.findIndex(item => item.ID === appTemp.ID);
      if (index !== -1) {
        this.approvals[index].name = appTemp.approvalName;
        this.approvals[index].isSequential = appTemp.isSequential;
        this.applySearch();
      }
    })
  }

  loadApprovals() {
    this.rest.getApprovalTemplates().subscribe(res=>{
      if(res["status"]===200){
        this.approvals = res['data'];
        this.applySearch();
      }
    });
  }

  applySearch() {
    if (!this.searchText.trim()) {
      this.filteredApprovals = [...this.approvals];
    } else {
      const s = this.searchText.trim().toLowerCase();
      this.filteredApprovals = this.approvals.filter(a => a.name.toLowerCase().includes(s));
    }
  }

  onTemplateCliclk(approval){
    this.approvalService.getApprovalTemplateByID(approval.ID).subscribe(res=>{
      this.matDialog.open(ApprovalViewEditDialogComponent, {
        width: '900px',
        height: '800px',
        data: res
      });
    });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetCreateForm();
    }
  }

  resetCreateForm() {
    this.newName = '';
    this.newDescription = '';
    this.newIsSequential = true;
  }

  createTemplate() {
    if (!this.newName.trim()) {
      this.dialogService.showSnackBar('Template name is required', '', 3000);
      return;
    }
    this.dialogService.showLoader();
    this.rest.createApprovalTemplate({
      name: this.newName.trim(),
      description: this.newDescription.trim(),
      isSequential: this.newIsSequential
    }).subscribe(res => {
      this.dialogService.closeLoader();
      if (res.data) {
        this.dialogService.showSnackBar('Approval template created', '', 3000);
        this.showCreateForm = false;
        this.resetCreateForm();
        this.loadApprovals();
      } else {
        this.dialogService.errorDialog(res);
      }
    });
  }

  deleteTemplate(event: Event, approval: any) {
    event.stopPropagation();
    this.dialogService.showLoader();
    this.rest.deleteApprovalTemplate(approval.ID).subscribe(res => {
      this.dialogService.closeLoader();
      this.approvals = this.approvals.filter(a => a.ID !== approval.ID);
      this.applySearch();
      this.dialogService.showSnackBar('Approval template deleted', '', 3000);
    });
  }

}
