import {Component, Input, OnInit} from '@angular/core';
import {DatePipe, NgForOf} from "@angular/common";
import {ColorLabelComponent} from "../../../../customComponents/color-label/color-label.component";
import {RestService} from "../../../../services/rest.service";
import {ClientsService} from "../../../../services/clients.service";
import {DialogService} from "../../../../services/dialog.service";

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    NgForOf,
    ColorLabelComponent,
    DatePipe
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css'
})
export class DocumentListComponent implements OnInit{

  @Input() clientId: any;

  fileList;

  constructor(private rest: RestService, private clientService: ClientsService, private dialogService: DialogService) {

  }

  ngOnInit(): void {
    this.getList();
  }

  showFile(id){
    this.rest.getFile(id).subscribe(res=>{
        let blob:Blob=res as Blob;
        let myBlob= new Blob([blob], {type: 'application/pdf'})
        const newWindow = window.open();
        newWindow.document.write(`<iframe src="${URL.createObjectURL(myBlob)}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    })
  }

  delete(id){
    this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isdelete=>{
      if (isdelete){
       this.rest.deleteDocumentById(id).subscribe(res=>{
         if (res.status === 200){
           this.dialogService.showSnackBar('Successfuly deleted document', '', 5000);
           this.getList()
         }else {
           console.log(res)
           this.dialogService.errorDialog(res);
         }
       })
      }
    });
  }

  getList(){
    this.rest.getFilesByClientId(this.clientService.currentClient.id).subscribe(res=>{
      if (res.status == 200) {
        this.fileList = res.data;
      }
    });
  }

}
