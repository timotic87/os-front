import {Component, Input, OnInit} from '@angular/core';
import {DatePipe} from "@angular/common";
import {RestService} from "../../../services/rest.service";
import {DialogService} from "../../../services/dialog.service";
import {DocumentService} from "../../../services/document.service";
import {MatDialog} from "@angular/material/dialog";
import {ButtonComponent} from "../ui/button/button.component";
import {BadgeComponent} from "../ui/badge/badge.component";

@Component({
  selector: 'app-compact-document-card',
  standalone: true,
  imports: [
    DatePipe,
    ButtonComponent,
    BadgeComponent
  ],
  templateUrl: './compact-document-card.component.html',
  styleUrl: './compact-document-card.component.css'
})
export class CompactDocumentCardComponent implements OnInit {

  @Input() document: any; // The document data
  @Input() approvalID: any;
  @Input() documentService?: DocumentService; // Optional, for backward compatibility
  
  private _documentService: DocumentService;

  constructor(
    private rest: RestService, 
    private dialogService: DialogService, 
    documentService: DocumentService,
    private matDialog: MatDialog
  ) {
    this._documentService = documentService;
  }

  ngOnInit() {
    // Use provided documentService or fallback to injected one
    if (this.documentService) {
      this._documentService = this.documentService;
    }
  }

  showFile() {
    window.open(`/documentview/${this.document.ID}`, '_blank');
  }

  delete() {
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isDelete => {
      if (isDelete) {
        this.dialogService.showLoader();
        this.rest.deleteDocumentById(this.document.ID, this.document.fileName).subscribe({
          next: res => {
            this.dialogService.closeLoader();
            if (res.status === 200) {
              // Emit events for both possible services
              this._documentService.activeDocumentChange.next(null);
              this._documentService.documentDeleted.next(true);
              this.dialogService.showSnackBar('Successfully deleted document', '', 4000);
            } else {
              this.dialogService.errorDialog(res);
            }
          },
          error: err => {
            this.dialogService.closeLoader();
            this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
          }
        });
      }
    });
  }

  submitDocument() {
    this._documentService.startApproval(this.document.ID, this.approvalID, this.document.dealID);
  }

  download() {
    this.rest.downloadFile(this.document.ID).subscribe(res => {
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = this.document.fileName;
      a.click();

      URL.revokeObjectURL(url);
    });
  }

  getBadgeVariant(): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
    const statusName = this.document?.status?.name;
    switch (statusName) {
      case 'Active':
      case 'Approved':
        return 'success';
      case 'Pending':
      case 'In Review':
        return 'warning';
      case 'Rejected':
      case 'Deleted':
        return 'destructive';
      case 'Draft':
        return 'secondary';
      default:
        return 'default';
    }
  }
}
