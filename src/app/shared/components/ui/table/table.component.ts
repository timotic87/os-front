import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../utils/cn';

@Component({
  selector: 'ui-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full overflow-auto">
      <table [class]="computedClass">
        <ng-content></ng-content>
      </table>
    </div>
  `
})
export class TableComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('w-full caption-bottom text-sm', this.className);
  }
}

@Component({
  selector: 'ui-table-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <thead [class]="computedClass">
      <ng-content></ng-content>
    </thead>
  `
})
export class TableHeaderComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('[&_tr]:border-b', this.className);
  }
}

@Component({
  selector: 'ui-table-body',
  standalone: true,
  imports: [CommonModule],
  template: `
    <tbody [class]="computedClass">
      <ng-content></ng-content>
    </tbody>
  `
})
export class TableBodyComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('[&_tr:last-child]:border-0', this.className);
  }
}

@Component({
  selector: 'ui-table-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <tr [class]="computedClass">
      <ng-content></ng-content>
    </tr>
  `
})
export class TableRowComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', this.className);
  }
}

@Component({
  selector: 'ui-table-head',
  standalone: true,
  imports: [CommonModule],
  template: `
    <th [class]="computedClass">
      <ng-content></ng-content>
    </th>
  `
})
export class TableHeadComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0', this.className);
  }
}

@Component({
  selector: 'ui-table-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <td [class]="computedClass">
      <ng-content></ng-content>
    </td>
  `
})
export class TableCellComponent {
  @Input() className: string = '';

  get computedClass(): string {
    return cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', this.className);
  }
}
