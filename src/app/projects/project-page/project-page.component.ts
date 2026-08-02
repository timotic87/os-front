import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RestService } from '../../services/rest.service';
import { DialogService } from '../../services/dialog.service';
import { ProjectActionsPanelComponent } from '../../flow-parts/project-actions-panel/project-actions-panel.component';

@Component({
  selector: 'app-project-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectActionsPanelComponent],
  templateUrl: './project-page.component.html'
})
export class ProjectPageComponent implements OnInit {

  project: any = null;
  annexes: any[] = [];
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private rest: RestService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const dealParam = this.route.snapshot.paramMap.get('dealID');

    if (idParam) {
      this.loadById(Number(idParam));
    } else if (dealParam) {
      // Resolve project by deal, then load full data by project ID
      this.rest.getProjectByDealID(Number(dealParam)).subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data?.ID) {
            this.loadById(res.data.ID);
          } else {
            this.loading = false; this.notFound = true;
          }
        },
        error: () => { this.loading = false; this.notFound = true; }
      });
    } else {
      this.loading = false; this.notFound = true;
    }
  }

  loadById(projectID: number) {
    this.loading = true;
    this.rest.getProjectById(projectID).subscribe({
      next: (res: any) => {
        this.project = res.data || null;
        this.notFound = !this.project;
        this.loading = false;
        if (this.project?.ID) this.loadAnnexes(this.project.ID);
      },
      error: () => { this.loading = false; this.notFound = true; }
    });
  }

  private loadAnnexes(projectID: number) {
    this.rest.getProjectAnnexes(projectID).subscribe({
      next: (res: any) => { if (res.status === 200) this.annexes = res.data || []; }
    });
  }

  get client(): string {
    const deal = this.project?.Deal || this.project?.deal;
    return deal?.client?.customerName || '—';
  }

  showDoc(doc: any) {
    if (doc?.ID) window.open(`/documentview/${doc.ID}`, '_blank');
  }

  downloadDoc(doc: any) {
    this.rest.downloadFile(doc.ID).subscribe((res: any) => {
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
