import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestService } from '../../../../services/rest.service';
import { ClientsService } from '../../../../services/clients.service';
import { DialogService } from '../../../../services/dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css'
})
export class DocumentListComponent implements OnInit {

  @Input() clientId: any;

  fileList: any[] = [];
  loading = true;

  // Approval detail expand
  expandedApprovalDocId: number | null = null;
  approvalSteps: any[] = [];
  approvalLoading = false;

  constructor(
    private rest: RestService,
    private clientService: ClientsService,
    private dialogService: DialogService,
    private router: Router
  ) {
    clientService.addDocumentSub.subscribe(() => {
      this.getList();
    });
  }

  ngOnInit(): void {
    this.getList();
  }

  showFile(id: number) {
    window.open(`/documentview/${id}`, '_blank');
  }

  downloadFile(id: number, fileName?: string) {
    this.rest.downloadFile(id).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'document.pdf';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.dialogService.showSnackBar('Failed to download document', '', 3000);
      }
    });
  }

  delete(id: number, filename: string) {
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isDelete => {
      if (isDelete) {
        this.rest.deleteDocumentById(id, filename).subscribe((res: any) => {
          if (res.status === 200) {
            this.dialogService.showSnackBar('Successfully deleted document', '', 3000);
            this.getList();
          } else {
            this.dialogService.errorDialog(res);
          }
        });
      }
    });
  }

  getList() {
    if (!this.clientId) return;
    this.loading = true;
    this.rest.getFilesByClientId(this.clientId).subscribe((res: any) => {
      if (res.status === 200) {
        this.fileList = res.data;
      }
      this.loading = false;
    });
  }

  get systemDocs() {
    return this.fileList.filter(f => f.isSystem);
  }

  get customDocs() {
    return this.fileList.filter(f => !f.isSystem);
  }

  toggleApproval(doc: any) {
    if (this.expandedApprovalDocId === doc.ID) {
      this.expandedApprovalDocId = null;
      this.approvalSteps = [];
      return;
    }
    if (!doc.approvalID) return;
    this.expandedApprovalDocId = doc.ID;
    this.approvalLoading = true;
    this.approvalSteps = [];
    this.rest.getApprovalByDocumetID(doc.ID).subscribe((res: any) => {
      if (res.status === 200 && res.data?.steps) {
        this.approvalSteps = res.data.steps;
      }
      this.approvalLoading = false;
    });
  }

  goToDeal(dealID: number) {
    if (!dealID) return;
    window.open(`/deal/${dealID}`, '_blank');
  }

  getStatusColor(statusID: number): string {
    switch (statusID) {
      case 1: return 'bg-secondary text-secondary-foreground';
      case 2: return 'bg-yellow-500/15 text-yellow-600';
      case 3: return 'bg-green-500/15 text-green-600';
      case 4: case 5: return 'bg-destructive/15 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  getApprovalStepColor(statusID: number): string {
    switch (statusID) {
      case 1: return 'border-muted-foreground/30 text-muted-foreground';
      case 2: return 'border-green-500 text-green-600';
      case 3: return 'border-destructive text-destructive';
      case 4: return 'border-muted-foreground/20 text-muted-foreground/50';
      default: return 'border-muted-foreground/30 text-muted-foreground';
    }
  }

  getApprovalStepIcon(statusID: number): string {
    switch (statusID) {
      case 2: return 'M5 13l4 4L19 7'; // checkmark
      case 3: return 'M6 18L18 6M6 6l12 12'; // X
      default: return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'; // clock
    }
  }
}
