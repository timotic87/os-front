import {Component, OnInit} from '@angular/core';
import {NgxExtendedPdfViewerModule} from "ngx-extended-pdf-viewer";
import {ActivatedRoute} from "@angular/router";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";


@Component({
  selector: 'app-document-view',
  standalone: true,
  imports: [
    NgxExtendedPdfViewerModule
  ],
  templateUrl: './document-view.component.html',
  styleUrl: './document-view.component.css'
})
export class DocumentViewComponent implements OnInit{

  pdfSrc: string | Uint8Array | undefined;

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
      next: (res: ArrayBuffer) => {
        console.log('✅ Fajl učitan');
        this.pdfSrc = new Uint8Array(res); // ovo je podržano
      },
      error: err => {
        this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.message);
        console.error('❌' + err.message, err);
      }
    });

  }



}
