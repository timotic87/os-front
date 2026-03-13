import {Component, Input, OnInit} from '@angular/core';
import {CurrencyPipe, DatePipe, NgIf, NgFor, CommonModule} from "@angular/common";
import {RestService} from "../../../../services/rest.service";
import {MatDialog} from "@angular/material/dialog";
import {ProjectAnnexDialogComponent} from "../../../../flow-parts/project-annex-dialog/project-annex-dialog.component";
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-project-card-stuffing',
  standalone: true,
  imports: [
    CommonModule, DatePipe, NgIf, NgFor, CurrencyPipe,
    ButtonComponent, CardComponent, CardHeaderComponent,
    CardTitleComponent, CardDescriptionComponent, CardContentComponent, BadgeComponent
  ],
  templateUrl: './project-card-stuffing.component.html',
  styleUrl: './project-card-stuffing.component.css'
})
export class ProjectCardStuffingComponent implements OnInit {

  @Input() deal: any;
  project: any;
  annexes: any[] = [];

  constructor(private rest: RestService, private matDialog: MatDialog) {}

  ngOnInit(): void {
    this.getProjectByDealID();
  }

  getProjectByDealID() {
    this.rest.getProjectByDealID(this.deal.ID).subscribe(res => {
      if (res.status === 200) {
        this.project = res.data;
        if (this.project?.ID) {
          this.loadAnnexes();
        }
      }
    });
  }

  loadAnnexes() {
    this.rest.getProjectAnnexes(this.project.ID).subscribe(res => {
      if (res.status === 200) {
        this.annexes = res.data;
      }
    });
  }

  openAnnexDialog() {
    const dialogRef = this.matDialog.open(ProjectAnnexDialogComponent, {
      maxHeight: '90vh',
      width: '70vw',
      data: {
        project: this.project,
        dealID: this.deal.ID,
        clientName: this.deal.client?.customerName,
        clientID: this.deal.client?.id,
        showCostFee: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getProjectByDealID();
      }
    });
  }

  showDoc(doc) {
    window.open(`/documentview/${doc.ID}`, '_blank');
  }

  downloadDoc(doc) {
    this.rest.downloadFile(doc.ID).subscribe(res => {
      const blob = new Blob([res], {type: 'application/pdf'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
