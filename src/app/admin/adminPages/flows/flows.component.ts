import {Component, OnInit} from '@angular/core';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent} from '../../../shared/components/ui/card/card.component';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';

interface FlowStep {
  stepType: string;
  orderIndex: number;
  label: string;
  documentTypeID: number | null;
  documentSubTypeID: number | null;
  approvalID: number | null;
  isRequired: boolean;
  onRejectStepIndex: number | null;
}

interface Flow {
  ID?: number;
  name: string;
  description: string;
  steps: FlowStep[];
}

@Component({
  selector: 'app-flows',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
    FormsModule, NgForOf, NgIf
  ],
  templateUrl: './flows.component.html',
  styleUrl: './flows.component.css'
})
export class FlowsComponent implements OnInit {

  flows: any[] = [];
  selectedFlow: any = null;
  documentTypes: any[] = [];
  documentSubTypes: any[] = [];
  approvalTemplates: any[] = [];

  // Edit/Create state
  isEditing = false;
  isCreating = false;
  editName = '';
  editDescription = '';
  editSteps: FlowStep[] = [];

  stepTypes = [
    { value: 'document', label: 'Document Upload & Approval' },
    { value: 'client_review', label: 'Client Review' },
    { value: 'contract_signing', label: 'Contract Signing' },
    { value: 'promoting_to_project', label: 'Promoting to Project' }
  ];

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.loadFlows();
    this.loadDocumentTypes();
    this.loadApprovalTemplates();
  }

  loadFlows() {
    this.rest.getFlows().subscribe(res => {
      if (res.status === 200) {
        this.flows = res.data;
        if (this.selectedFlow) {
          this.selectedFlow = this.flows.find(f => f.ID === this.selectedFlow.ID) || null;
        }
      }
    });
  }

  loadDocumentTypes() {
    this.rest.getAllDocumentTypes().subscribe(res => {
      if (res.status === 200) {
        this.documentTypes = res.data;
      }
    });
    this.rest.getAllDocumentSubTypes().subscribe(res => {
      if (res.status === 200) {
        this.documentSubTypes = res.data;
      }
    });
  }

  loadApprovalTemplates() {
    this.rest.getApprovalTemplates().subscribe(res => {
      if (res.status === 200) {
        this.approvalTemplates = res.data;
      }
    });
  }

  selectFlow(flow: any) {
    this.selectedFlow = flow;
    this.cancelEdit();
  }

  // --- Create Flow ---
  startCreate() {
    this.isCreating = true;
    this.isEditing = false;
    this.selectedFlow = null;
    this.editName = '';
    this.editDescription = '';
    this.editSteps = [];
  }

  // --- Edit Flow ---
  startEdit() {
    if (!this.selectedFlow) return;
    this.isEditing = true;
    this.isCreating = false;
    this.editName = this.selectedFlow.name;
    this.editDescription = this.selectedFlow.description || '';
    this.editSteps = (this.selectedFlow.steps || []).map((s: any) => ({
      stepType: s.stepType,
      orderIndex: s.orderIndex,
      label: s.label || '',
      documentTypeID: s.documentTypeID,
      documentSubTypeID: s.documentSubTypeID,
      approvalID: s.approvalID,
      isRequired: s.isRequired !== false,
      onRejectStepIndex: s.onRejectStepIndex || null
    }));
  }

  cancelEdit() {
    this.isEditing = false;
    this.isCreating = false;
    this.editSteps = [];
  }

  // --- Steps management ---
  addStep() {
    this.editSteps.push({
      stepType: 'document',
      orderIndex: this.editSteps.length + 1,
      label: '',
      documentTypeID: null,
      documentSubTypeID: null,
      approvalID: null,
      isRequired: true,
      onRejectStepIndex: null
    });
  }

  removeStep(index: number) {
    this.editSteps.splice(index, 1);
    this.reindexSteps();
  }

  moveStepUp(index: number) {
    if (index <= 0) return;
    const temp = this.editSteps[index];
    this.editSteps[index] = this.editSteps[index - 1];
    this.editSteps[index - 1] = temp;
    this.reindexSteps();
  }

  moveStepDown(index: number) {
    if (index >= this.editSteps.length - 1) return;
    const temp = this.editSteps[index];
    this.editSteps[index] = this.editSteps[index + 1];
    this.editSteps[index + 1] = temp;
    this.reindexSteps();
  }

  private reindexSteps() {
    this.editSteps.forEach((s, i) => s.orderIndex = i + 1);
  }

  getSubTypesForType(typeID: number | null): any[] {
    if (!typeID) return [];
    return this.documentSubTypes.filter(st => st.typeID === typeID);
  }

  onStepTypeChange(step: FlowStep) {
    if (step.stepType !== 'document') {
      step.documentTypeID = null;
      step.documentSubTypeID = null;
      step.approvalID = null;
    }
  }

  // --- Save ---
  save() {
    if (!this.editName.trim()) {
      this.dialogService.showSnackBar('Flow name is required', '', 3000);
      return;
    }
    if (this.editSteps.length === 0) {
      this.dialogService.showSnackBar('Flow must have at least one step', '', 3000);
      return;
    }

    const data = {
      name: this.editName.trim(),
      description: this.editDescription.trim(),
      steps: this.editSteps
    };

    if (this.isCreating) {
      this.dialogService.showLoader();
      this.rest.createFlow(data).subscribe(res => {
        this.dialogService.closeLoader();
        if (res.status === 201) {
          this.dialogService.showSnackBar('Flow created', '', 3000);
          this.selectedFlow = res.data;
          this.cancelEdit();
          this.loadFlows();
        } else {
          this.dialogService.errorDialog(res);
        }
      });
    } else if (this.isEditing && this.selectedFlow) {
      this.dialogService.showLoader();
      this.rest.updateFlow(this.selectedFlow.ID, data).subscribe(res => {
        this.dialogService.closeLoader();
        if (res.status === 201) {
          this.dialogService.showSnackBar('Flow updated', '', 3000);
          this.selectedFlow = res.data;
          this.cancelEdit();
          this.loadFlows();
        } else {
          this.dialogService.errorDialog(res);
        }
      });
    }
  }

  // --- Delete ---
  deleteFlow(flow: any) {
    this.dialogService.showLoader();
    this.rest.deleteFlow(flow.ID).subscribe(res => {
      this.dialogService.closeLoader();
      if (res.status === 201) {
        this.flows = this.flows.filter(f => f.ID !== flow.ID);
        if (this.selectedFlow?.ID === flow.ID) {
          this.selectedFlow = null;
        }
        this.dialogService.showSnackBar('Flow deleted', '', 3000);
      } else {
        this.dialogService.errorDialog(res);
      }
    });
  }

  getStepTypeLabel(stepType: string): string {
    return this.stepTypes.find(st => st.value === stepType)?.label || stepType;
  }

  getDocTypeName(id: number | null): string {
    if (!id) return '';
    return this.documentTypes.find(dt => dt.ID === id)?.typeName || '';
  }

  getDocSubTypeName(id: number | null): string {
    if (!id) return '';
    return this.documentSubTypes.find(dt => dt.ID === id)?.subTypeName || '';
  }

  getApprovalTemplateName(id: number | null): string {
    if (!id) return '';
    return this.approvalTemplates.find(at => at.ID === id)?.name || `#${id}`;
  }
}
