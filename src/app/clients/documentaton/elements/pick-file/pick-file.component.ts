import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-pick-file',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './pick-file.component.html',
  styleUrl: './pick-file.component.css'
})

export class PickFileComponent {
  @Output() onFileSelected = new EventEmitter<Event>();

  @Input() mandatory = true;

  onFileChange(event: Event) {
    this.onFileSelected.emit(event)
  }
}
