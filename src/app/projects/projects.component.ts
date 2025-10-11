import {Component, OnInit} from '@angular/core';
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import { RestService } from '../services/rest.service';
import {MatDialog} from "@angular/material/dialog";
import {AssignAdminComponent} from "./assign-admin/assign-admin.component";

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
    NgIf,
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

  deals;

  filterForm: FormGroup;

  filteredData;

  constructor(private rest: RestService, private matDialog: MatDialog) {
    this.updateDealsList()
  }

  ngOnInit(): void {
    this.filterForm = new FormGroup({
      isExpired: new FormControl(''),
      isAssigned: new FormControl(''),
      startDate: new FormControl(''),
      endDate: new FormControl(''),
      clientName: new FormControl(''),
      bdConsultant: new FormControl(''),
      hrAdmin: new FormControl(''),
      status: new FormControl({value:'', disabled: true}, )
    });

    this.filteredData = [...this.deals];
    }

  updateDealsList(){
    this.rest.getDeals().subscribe(res=>{
      if (res.status === 200) {
        this.deals=res.data;
        this.applyFilters()
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    this.filteredData = this.deals.filter(item => {
      const bdFullName = `${item.bdFirstName} ${item.bdLastName}`.toLowerCase();
      const hraFullName = `${item.hraFirstName} ${item.hraLastName}`.toLowerCase();
      const isSameDate = (date1: Date, date2: Date): boolean => {
        return (
          date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate()
        );
      };
      return (
        (filters.isExpired === '' || item.isExpired === JSON.parse(filters.isExpired)) &&
        (filters.isAssigned === '' || JSON.parse(filters.isAssigned) === (!!item.hraID)) &&
        (!filters.startDate || isSameDate(new Date(item.startDate), new Date(filters.startDate))) &&
        (!filters.endDate || isSameDate(new Date(item.endDate), new Date(filters.endDate))) &&
        (!filters.clientName || item.clientName.toLowerCase().includes(filters.clientName.toLowerCase())) &&
        (!filters.bdConsultant || bdFullName.includes(filters.bdConsultant.toLowerCase())) &&
        (!filters.hrAdmin || hraFullName.includes(filters.hrAdmin.toLowerCase()))
      );
    });
  }
  addAdmin(deal, event: Event){
    event.stopPropagation()
    this.matDialog.open(AssignAdminComponent, {
      width: '60vw',
      height: '60vh',
      data: deal
    })
  }

  dealClick(deal){
    console.log("click deal")
  }

  // Statistics methods for dashboard cards
  getAssignedProjectsCount(): number {
    return this.deals?.filter(deal => deal.hraID).length || 0;
  }

  getExpiredProjectsCount(): number {
    return this.deals?.filter(deal => deal.isExpired).length || 0;
  }

  getUnassignedProjectsCount(): number {
    return this.deals?.filter(deal => !deal.hraID).length || 0;
  }

  // Clear filters functionality
  clearFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

}
