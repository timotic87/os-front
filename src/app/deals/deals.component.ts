import { Component } from '@angular/core';
import {DatePipe} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {FormsModule} from "@angular/forms";
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent {

  searchText

  deals;

  constructor(private rest: RestService) {
    this.updateDealsList()
  }

  search(){

  }

  searchEvent(event){

  }

  updateDealsList(){
    this.rest.getDeals().subscribe(res=>{
      if (res.status === 200) {
        this.deals=res.data;
        console.log(this.deals);
      }
    });
  }

}
