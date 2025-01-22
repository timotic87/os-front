import {Component, OnInit} from '@angular/core';
import {DatePipe, NgClass, NgIf} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    ReactiveFormsModule,
    NgClass,
    NgIf
  ],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent implements OnInit {

  searchText

  deals;

  filterForm: FormGroup;

  filteredData;

  constructor(private rest: RestService) {
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

  search(){

  }

  searchEvent(event){

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
    });  }

}
