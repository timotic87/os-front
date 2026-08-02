import {Component, OnInit} from '@angular/core';
import {DatePipe} from "@angular/common";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import { RestService } from '../services/rest.service';
import {Router, RouterModule} from "@angular/router";

// shadCN UI Components
import { ButtonComponent } from '../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../shared/components/ui/card/card.component';
import { InputComponent } from '../shared/components/ui/input/input.component';
import { SelectComponent } from '../shared/components/ui/select/select.component';
import { TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent } from '../shared/components/ui/table/table.component';
import { BadgeComponent } from '../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    ReactiveFormsModule,
    RouterModule,
    // shadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    InputComponent,
    SelectComponent,
    TableComponent,
    TableHeaderComponent,
    TableBodyComponent,
    TableRowComponent,
    TableHeadComponent,
    TableCellComponent,
    BadgeComponent
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements OnInit {

  projects: any[] = [];
  filteredData: any[] = [];
  filterForm: FormGroup;

  constructor(private rest: RestService, private router: Router) {}

  ngOnInit(): void {
    this.filterForm = new FormGroup({
      clientName: new FormControl(''),
      bdConsultant: new FormControl(''),
      status: new FormControl(''),
      isExpired: new FormControl(''),
    });
    this.loadProjects();
  }

  loadProjects(): void {
    this.rest.getProjectsList().subscribe(res => {
      if (res.status === 200) {
        this.projects = res.data || [];
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    const f = this.filterForm.value;
    this.filteredData = this.projects.filter(p => {
      const bd = `${p.bdFirstName || ''} ${p.bdLastName || ''}`.toLowerCase();
      return (
        (!f.clientName || (p.clientName || '').toLowerCase().includes(f.clientName.toLowerCase())) &&
        (!f.bdConsultant || bd.includes(f.bdConsultant.toLowerCase())) &&
        (f.status === '' || String(p.status) === String(f.status)) &&
        (f.isExpired === '' || p.isExpired === JSON.parse(f.isExpired))
      );
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ clientName: '', bdConsultant: '', status: '', isExpired: '' });
    this.applyFilters();
  }

  openProject(p: any): void {
    if (p?.ID) this.router.navigate(['/projects', p.ID]);
  }

  get totalCount(): number { return this.projects.length; }
  getOpenCount(): number { return this.projects.filter(p => Number(p.status) !== 2).length; }
  getClosedCount(): number { return this.projects.filter(p => Number(p.status) === 2).length; }
  getExpiredCount(): number { return this.projects.filter(p => p.isExpired).length; }
}
