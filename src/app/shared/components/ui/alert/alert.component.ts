import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800/50 dark:bg-green-900/50 dark:text-green-300",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-900/50 dark:text-yellow-300",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:bg-blue-900/50 dark:text-blue-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

@Component({
  selector: 'ui-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass" role="alert">
      <!-- Icon -->
      <div *ngIf="showIcon" class="absolute left-4 top-4">
        <svg *ngIf="variant === 'destructive'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <svg *ngIf="variant === 'success'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline points="9,11 12,14 22,4"/>
          <path d="m21,12c0,4.97 -4.03,9 -9,9c-4.97,0 -9,-4.03 -9,-9c0,-4.97 4.03,-9 9,-9c1.16,0 2.27,0.22 3.29,0.62"/>
        </svg>
        <svg *ngIf="variant === 'warning'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="m21.73,18l-8,-14a2,2 0 0,0 -3.46,0l-8,14a2,2 0 0,0 1.73,3h16a2,2 0 0,0 1.73,-3z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <svg *ngIf="variant === 'info'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </div>
      
      <!-- Content -->
      <div [class]="contentClass">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class AlertComponent implements VariantProps<typeof alertVariants> {
  @Input() variant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default';
  @Input() className: string = '';
  @Input() showIcon: boolean = true;

  get computedClass(): string {
    return cn(alertVariants({ variant: this.variant }), this.className);
  }

  get contentClass(): string {
    return this.showIcon ? 'pl-7' : '';
  }
}

@Component({
  selector: 'ui-alert-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h5 [class]="computedClass">
      <ng-content></ng-content>
    </h5>
  `
})
export class AlertTitleComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('mb-1 font-medium leading-none tracking-tight', this.className);
  }
}

@Component({
  selector: 'ui-alert-description',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass">
      <ng-content></ng-content>
    </div>
  `
})
export class AlertDescriptionComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('text-sm [&_p]:leading-relaxed', this.className);
  }
}
