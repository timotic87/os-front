import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {DocumentService} from "../../services/document.service";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

@Component({
  selector: 'app-save-documet-dialog',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgClass,
    ButtonComponent
  ],
  templateUrl: './save-documet-dialog.component.html',
  styleUrl: './save-documet-dialog.component.css',
  host: {
    'class': 'transparent-dialog-host'
  }
})
export class SaveDocumetDialogComponent implements OnInit, OnDestroy {

  docForm: FormGroup;
  serviceType: string = '';
  documentType: string = '';
  private destroy$ = new Subject<void>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private rest: RestService, private dialogRef: MatDialogRef<SaveDocumetDialogComponent>,
              private dialogService: DialogService, private documentService: DocumentService) {
    // Determine service and document type based on data
    this.serviceType = data.deal?.service?.name || 'Service';
    this.documentType = data.documetTypeID === 1 ? 'offer' : 'contract'; // Assuming 1 = offer, 2 = contract
  }

  ngOnInit(): void {
    this.docForm = new FormGroup({
      docName: new FormControl(null, [Validators.required])
    });
    }

  generateFileName(): string {
    const userInput = this.docForm.get('docName')?.value || '';
    const timestamp = this.generateTimestamp();
    
    // For recruitment contracts (docSubTypeID = 9), let backend handle the complete filename
    // including timestamp to avoid duplicate prefixes and timestamps
    if (this.data.docSubTypeID === 9) {
      return userInput;
    }
    
    return `${this.serviceType}-${this.documentType}-${userInput}-${timestamp}`;
  }

  generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  }

  getFileNamePreview(): string {
    const userInput = this.docForm.get('docName')?.value || '[your-name]';
    
    // For recruitment contracts (docSubTypeID = 9), show different preview
    if (this.data.docSubTypeID === 9) {
      return `RECRUITMENT-offer_contract-${userInput}-[timestamp]`;
    }
    
    return `${this.serviceType}-${this.documentType}-${userInput}-[timestamp]`;
  }

  save(){
    console.log('🔍 SCROLL DEBUG: save() method called');
    console.log('🔍 SCROLL DEBUG: current scroll position:', window.pageYOffset || document.documentElement.scrollTop);
    
    const file = this.data.file;
    const deal = this.data.deal;
    const finalFileName = this.generateFileName();
    
    let formParams = new FormData();
    formParams.append('file', file as File);
    formParams.set('filePath', deal.client.customerName);
    formParams.set('fileName', finalFileName);
    formParams.set('clientId', (deal.client.id).toString());
    formParams.set('dealID', (deal.ID).toString());
    formParams.set('documetTypeID', this.data.documetTypeID.toString());
    formParams.set('docSubTypeID', this.data.docSubTypeID.toString());

    this.dialogService.showLoader();
    
    console.log('🔍 SCROLL DEBUG: before HTTP request, scroll position:', window.pageYOffset || document.documentElement.scrollTop);
    
    this.rest.saveFileSys(formParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('🔍 SCROLL DEBUG: HTTP response received, scroll position:', window.pageYOffset || document.documentElement.scrollTop);
          
          this.dialogService.closeLoader(); // Fix: should be closeLoader, not showLoader
          if (result.status===200) {
            console.log('🔍 SCROLL DEBUG: success, emitting events...');
            this.documentService.activeDocumentChange.next(result.data);
            this.documentService.addNewDocument.next(result.data);
            
            console.log('🔍 SCROLL DEBUG: before dialog close, scroll position:', window.pageYOffset || document.documentElement.scrollTop);
            this.dialogRef.close(true);
            
            // Check scroll position after a delay
            setTimeout(() => {
              console.log('🔍 SCROLL DEBUG: 100ms after dialog close, scroll position:', window.pageYOffset || document.documentElement.scrollTop);
            }, 100);
            
            setTimeout(() => {
              console.log('🔍 SCROLL DEBUG: 500ms after dialog close, scroll position:', window.pageYOffset || document.documentElement.scrollTop);
            }, 500);
          }
        },
        error: (err) => {
          console.log('🔍 SCROLL DEBUG: HTTP error, scroll position:', window.pageYOffset || document.documentElement.scrollTop);
          this.dialogService.closeLoader()
          this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.error.message);
        }
      });

  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
