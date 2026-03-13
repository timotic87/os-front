import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {RestService} from '../../../../services/rest.service';
import {DialogService} from '../../../../services/dialog.service';
import {UserService} from '../../../../services/user.service';
import {SaveDocumetDialogComponent} from '../../../../flow-parts/save-documet-dialog/save-documet-dialog.component';
import {ApprovalCardComponent} from '../../../../customComponents/approval-card/approval-card.component';
import {ButtonComponent} from '../../../../shared/components/ui/button/button.component';
import {BadgeComponent} from '../../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-custom-flow-document-step',
  standalone: true,
  imports: [CommonModule, ApprovalCardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './custom-flow-document-step.component.html',
  styleUrl: './custom-flow-document-step.component.css'
})
export class CustomFlowDocumentStepComponent implements OnInit, OnDestroy {

  @Input() deal: any;
  @Input() docTypeID: number = 1;
  @Input() docSubTypeID: number | null = null;
  @Input() approvalID: number | null = null;
  @Input() type: 'offer' | 'contract' = 'offer';
  @Input() readonly: boolean = false;

  @Output() stepCompleted = new EventEmitter<void>();

  activeDocument: any = null;
  inactiveDocuments: any[] = [];
  approval: any = null;
  isSubmitting = false;
  private destroyed = false;

  constructor(
    private rest: RestService,
    private dialogService: DialogService,
    private userService: UserService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadActiveDocument();
    this.loadInactiveDocuments();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  /** Poziva se iz parent-a kada se korak vrati unazad */
  reload(): void {
    this.activeDocument = null;
    this.inactiveDocuments = [];
    this.approval = null;
    this.loadActiveDocument();
    this.loadInactiveDocuments();
  }

  loadActiveDocument(): void {
    this.rest.getActiveFileListByDealIdAndTypeId({dealID: this.deal.ID, typeID: this.docTypeID}).subscribe({
      next: res => {
        if (this.destroyed) return;
        if (res.status === 200) {
          this.activeDocument = res.data || null;
          if (this.activeDocument) {
            this.loadApproval();
          } else {
            this.approval = null;
          }
        }
      }
    });
  }

  loadInactiveDocuments(): void {
    this.rest.getInactiveFileListByDealIdAndTypeId({dealID: this.deal.ID, typeID: this.docTypeID}).subscribe({
      next: res => {
        if (this.destroyed) return;
        if (res.status === 200) {
          this.inactiveDocuments = res.data || [];
        }
      }
    });
  }

  loadApproval(): void {
    if (!this.activeDocument?.ID) {
      this.approval = null;
      return;
    }
    this.rest.getApprovalByDocumetID(this.activeDocument.ID).subscribe({
      next: res => {
        if (this.destroyed) return;
        if (res.status === 200) {
          this.approval = res.data;
        }
      },
      error: () => { this.approval = null; }
    });
  }

  async openFileExplorer(fileInput: HTMLInputElement): Promise<void> {
    if (!this.userService.can('edit_deal') && !await this.userService.hasEntityAccess('deal', this.deal.ID, 'edit')) {
      this.dialogService.showMsgDialog("You don't have the right to change deals.");
      return;
    }
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      this.dialogService.showMsgDialog('Please select a PDF file.');
      input.value = '';
      return;
    }

    const dialogRef = this.matDialog.open(SaveDocumetDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {file, deal: this.deal, documetTypeID: this.docTypeID, docSubTypeID: this.docSubTypeID}
    });
    input.value = '';

    dialogRef.afterClosed().subscribe(result => {
      if (result && !this.destroyed) {
        this.loadActiveDocument();
        this.loadInactiveDocuments();

        // Bez approval-a: korak završen nakon uploada
        if (!this.approvalID) {
          this.stepCompleted.emit();
        }
      }
    });
  }

  submitForApproval(): void {
    if (!this.activeDocument || !this.approvalID) return;
    this.isSubmitting = true;
    this.dialogService.showLoader();

    this.rest.lockCDCM(this.activeDocument.ID, this.approvalID, this.deal.ID).subscribe({
      next: res => {
        this.dialogService.closeLoader();
        this.isSubmitting = false;
        if (this.destroyed) return;
        if (res.status === 200) {
          this.dialogService.showSnackBar('Document submitted for approval!', '', 3000);
          // Reload da vidimo novi status i approval
          setTimeout(() => {
            this.loadActiveDocument();
            this.loadInactiveDocuments();
          }, 800);
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.isSubmitting = false;
        this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
      }
    });
  }

  onApprovalUpdated(event: any): void {
    this.approval = event.approval;
  }

  onAllApproved(event: any): void {
    this.loadActiveDocument();
    this.loadInactiveDocuments();
    this.stepCompleted.emit();
  }

  viewDoc(): void {
    window.open(`/documentview/${this.activeDocument.ID}`, '_blank');
  }

  downloadDoc(): void {
    this.rest.downloadFile(this.activeDocument.ID).subscribe(res => {
      const blob = new Blob([res], {type: 'application/pdf'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.activeDocument.fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  deleteDoc(): void {
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isDelete => {
      if (isDelete) {
        this.dialogService.showLoader();
        this.rest.deleteDocumentById(this.activeDocument.ID, this.activeDocument.fileName).subscribe({
          next: res => {
            this.dialogService.closeLoader();
            if (res.status === 200) {
              this.activeDocument = null;
              this.approval = null;
              this.loadInactiveDocuments();
              this.dialogService.showSnackBar('Document deleted', '', 3000);
            }
          },
          error: err => {
            this.dialogService.closeLoader();
            this.dialogService.showMsgDialog('Error: ' + (err.error?.message || err.message));
          }
        });
      }
    });
  }

  getStatusBadgeVariant(): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' {
    const statusName = this.activeDocument?.status?.name;
    switch (statusName) {
      case 'Active': case 'Approved': return 'success';
      case 'Pending': case 'Submited': return 'warning';
      case 'Rejected': case 'Client reject': return 'destructive';
      default: return 'secondary';
    }
  }

  viewInactiveDoc(doc: any): void {
    window.open(`/documentview/${doc.ID}`, '_blank');
  }
}
