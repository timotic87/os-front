import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-pick-file',
  standalone: true,
  imports: [
  ],
  templateUrl: './pick-file.component.html',
  styleUrl: './pick-file.component.css'
})

export class PickFileComponent {
  @Output() onFileSelected = new EventEmitter<Event>();

  onFileChange(event: Event) {
    this.onFileSelected.emit(event)
  }
}
