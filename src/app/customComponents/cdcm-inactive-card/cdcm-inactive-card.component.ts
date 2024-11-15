import {Component, Input} from '@angular/core';
import {CDCM} from "../../models/cdcm";
import {ColorLabelComponent} from "../color-label/color-label.component";
import {DatePipe, NgIf} from "@angular/common";

@Component({
  selector: 'app-cdcm-inactive-card',
  standalone: true,
  imports: [
    ColorLabelComponent,
    DatePipe,
    NgIf
  ],
  templateUrl: './cdcm-inactive-card.component.html',
  styleUrl: './cdcm-inactive-card.component.css'
})
export class CdcmInactiveCardComponent {

  @Input() cdcm: CDCM;

  constructor() {
  }


}
