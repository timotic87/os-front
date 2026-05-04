import {Component, Input, OnInit, ChangeDetectorRef, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {FLOW_STATUS} from '../../../models/flow-status.constants';
import {DokumentApprovalComponent} from "../../../flow-parts/dokument-approval/dokument-approval.component";
import {CommonModule} from "@angular/common";
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {DocumentService} from '../../../services/document.service';
import {RecruitingOrderFormComponent} from '../recruiting-order-form/recruiting-order-form.component';
import {MatDialog} from '@angular/material/dialog';
import {AddPositionDialogComponent} from '../add-position-dialog/add-position-dialog.component';
// ShadCN UI Components
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-reg-flow',
  standalone: true,
  imports: [
    DokumentApprovalComponent,
    RecruitingOrderFormComponent,
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    BadgeComponent,
    AddPositionDialogComponent
  ],
  templateUrl: './reg-flow.component.html',
  styleUrl: './reg-flow.component.css'
})
export class RegFlowComponent implements OnInit {

  @Input() deal: any;

  @ViewChild('documentComponent') documentComponent!: DokumentApprovalComponent;

  recruitingOrder: any = null;
  isCreatingOrder: boolean = false;
  hasDocument: boolean = false;

  constructor(
    private rest: RestService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private documentService: DocumentService,
    private dialog: MatDialog,
    private router: Router
  ) {
    documentService.approvalRejected.subscribe(() => {
      this.refreshDocumentLists();
    });

    // Unlock step 2 when an active document is detected
    documentService.activeDocumentChange.subscribe(doc => {
      if (doc) {
        this.hasDocument = true;
        this.cdr.detectChanges();
      }
    });

    // Unlock step 2 when any inactive documents exist
    documentService.inactiveDocumentChange.subscribe(list => {
      if (list && list.length > 0) {
        this.hasDocument = true;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.checkForExistingRecruitingOrder();
  }

  private checkForExistingRecruitingOrder(): void {
    if (!this.deal?.ID) return;
    this.rest.getRecruitingOrderByDealId(this.deal.ID).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.recruitingOrder = res.data;
          this.hasDocument = true;
          this.cdr.detectChanges();
        }
      }
    });
  }

  getCurrentDocTypeID(): number {
    return 1;
  }

  getCurrentDocSubTypeID(): number {
    return 9;
  }

  getCurrentApprovalID(): number {
    return 9;
  }

  getCurrentDocType(): 'offer' | 'contract' {
    return 'offer';
  }

  isDealActive(): boolean {
    return this.deal?.statusID === 1;
  }

  isActionsDisabled(): boolean {
    return !this.isDealActive();
  }

  isStep2Active(): boolean {
    return this.hasDocument || !!this.recruitingOrder;
  }

  getStepCardClass(active: boolean): string {
    return active
      ? 'transition-all duration-200'
      : 'transition-all duration-200 opacity-60 bg-muted/30';
  }

  getStepIndicatorClass(active: boolean): string {
    const base = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold';
    return active
      ? `${base} bg-primary/10 text-primary`
      : `${base} bg-muted text-muted-foreground`;
  }

  getFlowStatusVariant(statusID: number): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
    if (statusID >= FLOW_STATUS.RECRUITING_ORDER) return 'success';
    return 'secondary';
  }

  private refreshDocumentLists(): void {
    if (this.documentComponent) {
      if (typeof this.documentComponent['getActiveOffer'] === 'function') {
        this.documentComponent['getActiveOffer']();
      }
      if (typeof this.documentComponent['getInaciveOfferDocs'] === 'function') {
        this.documentComponent['getInaciveOfferDocs']();
      }
    }
  }

  onOrderCreating(isCreating: boolean): void {
    this.isCreatingOrder = isCreating;
    this.cdr.detectChanges();
  }

  onOrderCreated(order: any): void {
    this.recruitingOrder = order;
    this.isCreatingOrder = false;
    if (this.deal?.flowStatus) {
      this.deal.flowStatus.ID = FLOW_STATUS.RECRUITING_ORDER_CREATED;
    }
    this.cdr.detectChanges();
    this.dialogService.showSnackBar('Recruiting order created successfully!', '', 3000);
  }

  viewRecruitingOrder(): void {
    if (this.recruitingOrder?.ID) {
      this.router.navigate(['/recruiting-order', this.recruitingOrder.ID]);
    }
  }

  addPosition(): void {
    if (!this.recruitingOrder?.ID) return;
    const dialogRef = this.dialog.open(AddPositionDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { orderID: this.recruitingOrder.ID }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.rest.getRecruitingOrderByID(this.recruitingOrder.ID).subscribe({
          next: (res) => {
            if (res.status === 200 && res.data) {
              this.recruitingOrder = res.data;
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }
}
