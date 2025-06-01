import {Component, Input,OnInit} from '@angular/core';
import {ColorLabelComponent} from "../../../../customComponents/color-label/color-label.component";
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {RestService} from "../../../../services/rest.service";

@Component({
  selector: 'app-project-card-pyhra',
  standalone: true,
  imports: [
    ColorLabelComponent,
    DatePipe,
    NgIf,
    CurrencyPipe
  ],
  templateUrl: './project-card-pyhra.component.html',
  styleUrl: './project-card-pyhra.component.css'
})
export class ProjectCardPyhraComponent implements OnInit {

  @Input() deal: any

  project: any;

  constructor(private rest: RestService) {
  }


  ngOnInit(): void {
    this.getProjectByDealID();
  }



  getProjectByDealID(){
    this.rest.getProjectByDealID(this.deal.ID).subscribe(res=>{
      if (res.status===200){
        this.project = res.data;
      }
    })
  }

  showDoc(doc){
  this.rest.getFile(doc.ID).subscribe(res=>{
    let blob:Blob=res as Blob;
    let myBlob= new Blob([blob], {type: 'application/pdf'})
    const newWindow = window.open();
    newWindow.document.write(`<iframe src="${URL.createObjectURL(myBlob)}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  });
  }

  downloadDoc(doc){
  this.rest.getFile(doc.ID).subscribe(res => {
    const blob = new Blob([res], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName; // Ovde zadaješ ime
    a.click();

    // Opciono: oslobodi memoriju
    URL.revokeObjectURL(url);
  });
  }

}
