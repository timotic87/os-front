import {Component, Input,OnInit} from '@angular/core';
import {ColorLabelComponent} from "../../../../customComponents/color-label/color-label.component";
import {CurrencyPipe, DatePipe, NgIf} from "@angular/common";
import {RestService} from "../../../../services/rest.service";

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [
    ColorLabelComponent,
    DatePipe,
    NgIf,
    CurrencyPipe
  ],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css'
})
export class ProjectCardComponent implements OnInit {

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
    window.open(`/documentview/${doc.ID}`, '_blank');
  }

  downloadDoc(doc){
  this.rest.downloadFile(doc.ID).subscribe(res => {
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
