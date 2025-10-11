import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-label',
  standalone: true,
  template: `
    <label 
      [for]="for"
      [class]="class"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      <ng-content></ng-content>
    </label>
  `,
  styles: []
})
export class LabelComponent {
  @Input() for?: string;
  @Input() class?: string;
}