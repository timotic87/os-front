import {Component, Input} from '@angular/core';
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {ColorLabelComponent} from "../../../../customComponents/color-label/color-label.component";

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    CurrencyPipe,
    ColorLabelComponent
  ],
  templateUrl: './deal-card.component.html',
  styleUrl: './deal-card.component.css'
})
export class DealCardComponent {

  @Input() deal: any;

  constructor() {
  }

}
