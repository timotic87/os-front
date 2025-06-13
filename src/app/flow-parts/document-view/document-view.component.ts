import {Component, OnInit} from '@angular/core';
import {NgxExtendedPdfViewerModule} from "ngx-extended-pdf-viewer";
import {ActivatedRoute} from "@angular/router";
import {RestService} from "../../services/rest.service";
import {NgIf} from "@angular/common";
import {DialogService} from "../../services/dialog.service";
import {DocumentService} from "../../services/document.service";


@Component({
  selector: 'app-document-view',
  standalone: true,
  imports: [
    NgxExtendedPdfViewerModule,
    NgIf
  ],
  templateUrl: './document-view.component.html',
  styleUrl: './document-view.component.css'
})
export class DocumentViewComponent implements OnInit{

  pdfSrc: string | undefined;

  constructor(private route: ActivatedRoute, private rest: RestService, private dialogService: DialogService) {
  }

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const documentID = Number(rawId);
    console.log('📄 Document ID:', documentID);

    if (!documentID || isNaN(documentID)) {
      console.error('❌ ID nije validan');
      return;
    }

    this.rest.getFileWW(documentID).subscribe({
      next: res => {
        console.log('✅ Fajl učitan');
        this.pdfSrc = URL.createObjectURL(new Blob([res], { type: 'application/pdf' }));
      },
      error: err => {
        this.dialogService.showMsgDialog('Status: '+err.status+' msg: ' + err.message);
        console.error('❌'+ err.message, err);
      }
    });
  }



}
