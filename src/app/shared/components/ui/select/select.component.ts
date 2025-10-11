import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <label *ngIf="label" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {{ label }}
        <span *ngIf="required" class="text-destructive">*</span>
      </label>
      
      <div class="relative">
        <select 
          [class]="computedClass"
          [disabled]="disabled"
          [value]="value"
          (change)="onSelectionChange($event)">
          <option *ngIf="placeholder" [value]="null" disabled>{{ placeholder }}</option>
          <ng-content></ng-content>
        </select>
        
        <!-- Chevron Icon -->
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
          </svg>
        </div>
      </div>
      
      <div *ngIf="error" class="text-sm text-destructive">{{ error }}</div>
      <div *ngIf="description" class="text-sm text-muted-foreground">{{ description }}</div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() error: string = '';
  @Input() description: string = '';
  @Input() className: string = '';

  @Output() valueChange = new EventEmitter<any>();

  value: any = null;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  get computedClass(): string {
    const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8';
    const errorClasses = this.error ? 'border-destructive' : '';
    return cn(baseClasses, errorClasses, this.className);
  }

  onSelectionChange(event: any): void {
    this.value = event.target.value === 'null' ? null : event.target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
