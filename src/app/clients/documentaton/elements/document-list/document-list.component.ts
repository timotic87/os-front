import {Component, Input, OnInit} from '@angular/core';
import {DatePipe, NgClass, NgForOf} from "@angular/common";
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
    DatePipe,
    NgClass
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css'
})
export class DocumentListComponent implements OnInit{

  @Input() clientId: any;
  @Input() projectID: any;

  fileList;

  constructor(private rest: RestService, private clientService: ClientsService, private dialogService: DialogService) {
    clientService.addDocumentSub.subscribe(()=>{
      this.getList();
    });

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

  delete(id, filename){
    console.log(filename)
      this.dialogService.showChooseDialog('Are you sure you want to delete this document?').afterClosed().subscribe(isdelete=>{
        if (isdelete){
          this.rest.deleteDocumentById(id, filename).subscribe(res=>{
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
    if (this.clientId){
      this.rest.getFilesByClientId(this.clientId).subscribe(res=>{
        if (res.status == 200) {
          this.fileList = res.data;
        }
      });
    }
    if (this.projectID){
      // this.rest.getFilesByProjectId(this.projectID).subscribe(res=>{
      //   if (res.status == 200) {
      //     console.log(res.data);
      //     this.fileList = res.data;
      //   }
      // });
    }
  }

}
