import {Component, Input, OnInit} from '@angular/core';
import {NgClass} from "@angular/common";

@Component({
  selector: 'app-color-label',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './color-label.component.html',
  styleUrl: './color-label.component.css'
})
export class ColorLabelComponent implements OnInit{
  @Input() color = '';
  styleCustom: string ='';
  textColor: string = '';

  constructor() {

  }

  ngOnInit(): void {
    switch (this.color){
      case 'orange':
        this.styleCustom = 'bg-orange-400';
        this.textColor = 'text-white';
        break;
      case 'red':
        this.styleCustom = 'bg-red-400';
        this.textColor = 'text-red-950';
        break;
      case 'green':
        this.styleCustom = 'bg-green-400';
        this.textColor = 'text-green-950';
        break;
      case 'blue':
        this.styleCustom = 'bg-blue-400';
        this.textColor = 'text-blue-950';
        break;
      default:
        this.styleCustom = 'bg-green-400';
        this.textColor = 'text-green-950';
        break;
    }
    }

}
