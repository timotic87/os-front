import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import {RestService} from "../../../services/rest.service";
import {MatDialog} from "@angular/material/dialog";
import {AddDocumentTypeComponent} from "./add-document-type/add-document-type.component";
import {AddDocumentSubTypeComponent} from "./add-document-sub-type/add-document-sub-type.component";
import {DialogService} from "../../../services/dialog.service";
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent} from '../../../shared/components/ui/card/card.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent,
    FormsModule, NgForOf, NgIf
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent {

  documetTypes: any[] = [];
  documentSubTypes: any[] = [];

  searchDocTypes = '';
  searchSubTypes = '';
  filterSubTypeByDocType = '';

  get filteredDocTypes(): any[] {
    if (!this.searchDocTypes.trim()) return this.documetTypes;
    const s = this.searchDocTypes.trim().toLowerCase();
    return this.documetTypes.filter(t => t.typeName.toLowerCase().includes(s));
  }

  get filteredSubTypes(): any[] {
    let result = this.documentSubTypes;
    if (this.filterSubTypeByDocType) {
      result = result.filter(t => String(t.DocumentType?.ID) === this.filterSubTypeByDocType);
    }
    if (this.searchSubTypes.trim()) {
      const s = this.searchSubTypes.trim().toLowerCase();
      result = result.filter(t => t.subTypeName.toLowerCase().includes(s));
    }
    return result;
  }

  constructor(private rest: RestService, private matDialog: MatDialog, private dialogService: DialogService) {
    this.getDocumetsTypes();
    this.getDocumetsSubTypes();
  }

  getDocumetsTypes() {
    this.rest.getDocumentTypes().subscribe(res => {
      if (res.status === 200) {
        this.documetTypes = res.data;
      }
    })
  }
  getDocumetsSubTypes() {
    this.rest.getDocumentSubTypes().subscribe(res => {
      if (res.status === 200) {
        this.documentSubTypes = res.data;
      }
    })
  }
  createDocType(){
    let refDialog = this.matDialog.open(AddDocumentTypeComponent, {
      width: '600px'
    });

    refDialog.afterClosed().subscribe(type => {
      if (type) {
        this.documetTypes.push(type);
      }
    })
  }
  createSubType(){
    let refDialog = this.matDialog.open(AddDocumentSubTypeComponent, {
      width: '600px',
      data: {docTypes: this.documetTypes}
    });
    refDialog.afterClosed().subscribe(type => {
      if (type) {
        this.documentSubTypes.push(type);
      }
    });
  }

  editDocumentTypeDialog(type: any){
    let refDialog = this.matDialog.open(AddDocumentTypeComponent, {
      width: '600px',
      data: {documentType: type}
    });

    refDialog.afterClosed().subscribe(type => {
      if (type) {
        this.getDocumetsTypes();
      }
    })
  }
  deleteDocumentType(type: any){
    this.dialogService.showChooseDialog('Are you sure you want to delete this document type?').afterClosed().subscribe(isYes => {
      if (isYes) {
        this.rest.deleteDocumentType(type.ID).subscribe({
          next: result => {
            if (result.status == 200) {
              this.getDocumetsTypes();
            }
          },
          error: err => {
            this.dialogService.errorServDialog(err);
          }
        });
      }
    });
  }

  editDocumnetSubtypeDialog(type: any){
    let refDialog = this.matDialog.open(AddDocumentSubTypeComponent, {
      width: '600px',
      data: {docTypes: this.documetTypes, subType: type}
    });
    refDialog.afterClosed().subscribe(type => {
      if (type) {
        this.getDocumetsSubTypes();
      }
    })
  }
  deleteDocumentSubtype(type: any){
    this.dialogService.showChooseDialog('Are you sure you want to delete this document subtype?').afterClosed().subscribe(isYes => {
      if (isYes) {
        this.rest.deleteDocumentSubtype(type.ID).subscribe({
          next: result => {
            if (result.status == 200) {
              this.getDocumetsSubTypes();
            }
          },
          error: err => {
            this.dialogService.errorServDialog(err);
          }
        });
      }
    });
  }



}
