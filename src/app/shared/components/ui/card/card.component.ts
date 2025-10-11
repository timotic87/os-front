import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('rounded-xl border bg-card text-card-foreground shadow', this.className);
  }
}

@Component({
  selector: 'ui-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass">
      <ng-content></ng-content>
    </div>
  `
})
export class CardHeaderComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('flex flex-col space-y-1.5 p-6', this.className);
  }
}

@Component({
  selector: 'ui-card-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 [class]="computedClass">
      <ng-content></ng-content>
    </h3>
  `
})
export class CardTitleComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('font-semibold leading-none tracking-tight', this.className);
  }
}

@Component({
  selector: 'ui-card-description',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p [class]="computedClass">
      <ng-content></ng-content>
    </p>
  `
})
export class CardDescriptionComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('text-sm text-muted-foreground', this.className);
  }
}

@Component({
  selector: 'ui-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass">
      <ng-content></ng-content>
    </div>
  `
})
export class CardContentComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('p-6 pt-0', this.className);
  }
}

@Component({
  selector: 'ui-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass">
      <ng-content></ng-content>
    </div>
  `
})
export class CardFooterComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('flex items-center p-6 pt-0', this.className);
  }
}
