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
  @Input() color = 'green';
  @Input() size: string = 'xs';
  styleCustom: string ='';

  constructor() {

  }

  ngOnInit(): void {
    switch (this.color){
      case 'orange':
        this.styleCustom = 'bg-orange-400';
        break;
      case 'red':
        this.styleCustom = 'bg-red-400';
        break;
      case 'green':
        this.styleCustom = 'bg-green-400';
        break;
      case 'blue':
        this.styleCustom = 'bg-blue-400';
        break;
    }
    this.styleCustom = this.styleCustom+' text-'+this.size

    }

}
