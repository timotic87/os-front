import {Component, Input, OnInit, OnDestroy, Renderer2, ElementRef, ViewEncapsulation} from '@angular/core';
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {RestService} from "../../../services/rest.service";
import {DialogService} from "../../../services/dialog.service";
import {DocumentService} from "../../../services/document.service";
import {MatDialog} from "@angular/material/dialog";
import {ButtonComponent} from "../../../shared/components/ui/button/button.component";
import {BadgeComponent} from "../../../shared/components/ui/badge/badge.component";

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    NgIf,
    ButtonComponent,
    BadgeComponent
  ],
  templateUrl: './document-card.component.html',
  styleUrl: './document-card.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DocumentCardComponent {

  @Input() approvalID: any;
  @Input() document: any; // Input for document data

  constructor(
    private rest: RestService, 
    private dialogService: DialogService, 
    public documentService: DocumentService, 
    private matDialog: MatDialog
  ) {
  }

  showFile() {
    const doc = this.document || this.documentService.activeDocument;
    window.open(`/documentview/${doc.ID}`, '_blank');
  }

  delete() {
    const doc = this.document || this.documentService.activeDocument;
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isDelete => {
      if (isDelete) {
        this.dialogService.showLoader();
        this.rest.deleteDocumentById(doc.ID, doc.fileName).subscribe({
          next: res => {
            this.dialogService.closeLoader();
            if (res.status === 200) {
              this.documentService.activeDocumentChange.next(null);
              // Update the page without full refresh
              this.documentService.documentDeleted.next(true);
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
    const doc = this.document || this.documentService.activeDocument;
    this.documentService.startApproval(doc.ID, this.approvalID, doc.dealID);
  }

  download() {
    const doc = this.document || this.documentService.activeDocument;
    this.rest.downloadFile(doc.ID).subscribe(res => {
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();

      URL.revokeObjectURL(url);
    });
  }

  getBadgeVariant(): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
    const doc = this.document || this.documentService.activeDocument;
    const statusName = doc?.status?.name;
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

  getStatusClass(): string {
    const doc = this.document || this.documentService.activeDocument;
    const statusName = doc?.status?.name;
    switch (statusName) {
      case 'Active':
      case 'Approved':
        return 'status-success';
      case 'Pending':
      case 'In Review':
        return 'status-warning';
      case 'Rejected':
      case 'Deleted':
        return 'status-destructive';
      case 'Draft':
        return 'status-secondary';
      default:
        return 'status-default';
    }
  }
}
