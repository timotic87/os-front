import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-inactive-document-card',
  standalone: true,
  imports: [NgClass, MatMenuModule, MatButtonModule],
  templateUrl: './inactive-document-card.component.html',
  styleUrl: './inactive-document-card.component.css'
})
export class InactiveDocumentCardComponent {
  @Input() document: any;
  
  @Output() viewDocument = new EventEmitter<any>();
  @Output() downloadDocument = new EventEmitter<any>();
  @Output() openApproval = new EventEmitter<any>();

  constructor() {}

  getStatusClasses(): string {
    if (!this.document?.status?.id) {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }

    const statusId = this.document.status.id || this.document.statusID;
    
    switch (statusId) {
      case 1:
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
      case 2:
        return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700';
      case 3:
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700';
      case 4:
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700';
      case 5:
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  }

  getStatusDotClasses(): string {
    if (!this.document?.status?.id) {
      return 'bg-gray-400';
    }

    const statusId = this.document.status.id || this.document.statusID;

    switch (statusId) {
      case 1:
        return 'bg-blue-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-green-500';
      case 4:
        return 'bg-red-500';
      case 5:
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusBorderClass(): string {
    if (!this.document?.status?.id) {
      return 'border-l-gray-400';
    }

    const statusId = this.document.status.id || this.document.statusID;

    switch (statusId) {
      case 1:
        return 'border-l-blue-500 dark:border-l-blue-400';
      case 2:
        return 'border-l-orange-500 dark:border-l-orange-400';
      case 3:
        return 'border-l-green-500 dark:border-l-green-400';
      case 4:
        return 'border-l-red-500 dark:border-l-red-400';
      case 5:
        return 'border-l-purple-500 dark:border-l-purple-400';
      default:
        return 'border-l-gray-400';
    }
  }

  onViewDocument(): void {
    this.viewDocument.emit(this.document);
  }

  onDownloadDocument(): void {
    this.downloadDocument.emit(this.document);
  }

  onOpenApproval(): void {
    this.openApproval.emit(this.document);
  }
}
