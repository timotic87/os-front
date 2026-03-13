import {Component, Input, OnInit, ChangeDetectorRef, ViewChildren, QueryList} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {ProjectAnnexDialogComponent} from '../../../flow-parts/project-annex-dialog/project-annex-dialog.component';
import {CustomFlowDocumentStepComponent} from './custom-flow-document-step/custom-flow-document-step.component';
import {ClientDocumentStatusComponent} from '../../../flow-parts/client-document-status/client-document-status.component';
import {CustomFlowPromoteStepComponent} from './custom-flow-promote-step/custom-flow-promote-step.component';
import {CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent} from '../../../shared/components/ui/card/card.component';
import {BadgeComponent} from '../../../shared/components/ui/badge/badge.component';

interface FlowStepDef {
  ID: number;
  stepType: string;
  orderIndex: number;
  label: string | null;
  documentTypeID: number | null;
  documentSubTypeID: number | null;
  approvalID: number | null;
  isRequired: boolean;
  onRejectStepIndex: number | null;
  documentType?: any;
  documentSubType?: any;
}

@Component({
  selector: 'app-custom-flow',
  standalone: true,
  imports: [
    CommonModule,
    CustomFlowDocumentStepComponent,
    ClientDocumentStatusComponent,
    CustomFlowPromoteStepComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './custom-flow.component.html',
  styleUrl: './custom-flow.component.css'
})
export class CustomFlowComponent implements OnInit {

  @Input() deal: any;
  @ViewChildren(CustomFlowDocumentStepComponent) docStepComponents: QueryList<CustomFlowDocumentStepComponent>;

  flowDef: any = null;
  steps: FlowStepDef[] = [];
  loading = true;
  currentStep = 1;
  projectInfo: any = null;
  annexes: any[] = [];

  constructor(
    private rest: RestService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentStep = this.deal?.customFlowStep || 1;
    this.loadFlowDefinition();
    this.loadProjectInfo();
  }

  private loadFlowDefinition(): void {
    const flowID = this.deal?.subservice?.flowID;
    if (!flowID) {
      this.loading = false;
      return;
    }

    this.rest.getFlowById(flowID).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.flowDef = res.data;
          this.steps = (res.data.steps || []).sort((a: FlowStepDef, b: FlowStepDef) => a.orderIndex - b.orderIndex);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  isStepActive(step: FlowStepDef): boolean {
    return step.orderIndex <= this.currentStep;
  }

  isCurrentStep(step: FlowStepDef): boolean {
    return step.orderIndex === this.currentStep;
  }

  isStepComplete(step: FlowStepDef): boolean {
    return step.orderIndex < this.currentStep;
  }

  getCurrentStepIndex(): number {
    return Math.min(this.currentStep - 1, this.steps.length - 1);
  }

  getProgressPercentage(): number {
    if (this.steps.length === 0) return 0;
    return Math.min((this.currentStep / this.steps.length) * 100, 100);
  }

  getStepLabel(step: FlowStepDef): string {
    if (step.label) return step.label;
    switch (step.stepType) {
      case 'document': return step.documentType?.typeName ? `${step.documentType.typeName} Document` : 'Document Upload & Approval';
      case 'client_review': return 'Client Review';
      case 'contract_signing': return 'Contract Signing';
      case 'promoting_to_project': return 'Promote to Project';
      default: return step.stepType;
    }
  }

  getStepDescription(step: FlowStepDef): string {
    switch (step.stepType) {
      case 'document': return 'Upload and get document approved';
      case 'client_review': return 'Send to client and await response';
      case 'contract_signing': return 'Mark contract as signed';
      case 'promoting_to_project': return 'Create project with contract details';
      default: return '';
    }
  }

  trackByStepId(index: number, step: FlowStepDef): number {
    return step.ID;
  }

  getDocType(step: FlowStepDef): 'offer' | 'contract' {
    return step.documentTypeID === 2 ? 'contract' : 'offer';
  }

  getStepCardClass(step: FlowStepDef): string {
    return this.isStepActive(step) ? 'transition-all duration-200' : 'transition-all duration-200 opacity-60 bg-muted/30';
  }

  getStepIndicatorClass(step: FlowStepDef): string {
    const base = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold';
    if (this.isStepComplete(step)) return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
    if (this.isStepActive(step)) return `${base} bg-primary/10 text-primary`;
    return `${base} bg-muted text-muted-foreground`;
  }

  // --- Status transitions ---

  onDocumentStepCompleted(): void {
    this.advanceToNextStep();
  }

  skipStep(): void {
    this.advanceToNextStep();
  }

  private advanceToNextStep(): void {
    const nextStep = this.currentStep + 1;
    if (nextStep <= this.steps.length) {
      this.saveCustomFlowStep(nextStep);
    } else {
      // Poslednji korak - flow završen
      this.saveCustomFlowStep(this.steps.length + 1);
      this.dialogService.showSnackBar('Flow completed!', '', 3000);
    }
  }

  onClientReviewStatusChange(event: any, step: FlowStepDef): void {
    if (event['clientAccepted'] === true) {
      this.advanceToNextStep();
    } else if (event['clientAccepted'] === false) {
      const returnTo = step.onRejectStepIndex || 1;
      this.saveCustomFlowStep(returnTo);
    } else {
      this.dialogService.showSnackBar('Choose the client response first', null, 2500);
    }
  }

  onContractSigned(): void {
    this.advanceToNextStep();
  }

  onProjectPromoted(event: any): void {
    // Backend već ažurira customFlowStep, samo sync frontend
    this.currentStep = (this.currentStep || 0) + 1;
    this.deal.customFlowStep = this.currentStep;
    this.cdr.detectChanges();
    this.dialogService.showSnackBar('Project created successfully!', '', 3000);
    // Reload sa servera da dobijemo pun objekat sa document relacijom
    this.loadProjectInfo();
  }

  viewProjectDoc(): void {
    if (this.projectInfo?.document?.ID) {
      window.open(`/documentview/${this.projectInfo.document.ID}`, '_blank');
    }
  }

  downloadProjectDoc(): void {
    if (this.projectInfo?.document?.ID) {
      this.rest.downloadFile(this.projectInfo.document.ID).subscribe(res => {
        const blob = new Blob([res], {type: 'application/pdf'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.projectInfo.document.fileName;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  openAnnexDialog(): void {
    if (!this.projectInfo) return;
    const dialogRef = this.matDialog.open(ProjectAnnexDialogComponent, {
      maxHeight: '90vh',
      width: '70vw',
      data: {
        project: this.projectInfo,
        dealID: this.deal.ID,
        clientName: this.deal.client?.customerName,
        clientID: this.deal.client?.id,
        showCostFee: false,
        showSalaryFee: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjectInfo();
        this.loadAnnexes();
      }
    });
  }

  viewAnnexDoc(annex: any): void {
    if (annex.document?.ID) {
      window.open(`/documentview/${annex.document.ID}`, '_blank');
    }
  }

  downloadAnnexDoc(annex: any): void {
    if (annex.document?.ID) {
      this.rest.downloadFile(annex.document.ID).subscribe(res => {
        const blob = new Blob([res], {type: 'application/pdf'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = annex.document.fileName;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  private loadProjectInfo(): void {
    this.rest.getProjectByDealID(this.deal.ID).subscribe({
      next: res => {
        if (res.status === 200 && res.data) {
          this.projectInfo = res.data;
          this.loadAnnexes();
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private loadAnnexes(): void {
    if (!this.projectInfo?.ID) return;
    this.rest.getProjectAnnexes(this.projectInfo.ID).subscribe({
      next: res => {
        if (res.status === 200) {
          this.annexes = res.data || [];
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private saveCustomFlowStep(step: number): void {
    const wasBackward = step < this.currentStep;
    this.rest.changeCustomFlowStep({ dealID: this.deal.ID, step }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.currentStep = step;
          this.deal.customFlowStep = step;
          this.cdr.detectChanges();

          // Nakon vraćanja unazad, reloaduj sve aktivne document step komponente
          if (wasBackward) {
            setTimeout(() => {
              this.docStepComponents.forEach(ds => ds.reload());
            }, 200);
          }
        }
      },
      error: (err) => {
        this.dialogService.showMsgDialog('Error updating step: ' + (err.error?.message || err.message));
      }
    });
  }
}
