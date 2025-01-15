import { Component } from '@angular/core';
import {DatePipe} from "@angular/common";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css'
})
export class DealsComponent {

  searchText

  constructor() {
  }

  search(){

  }

  searchEvent(event){

  }

}
