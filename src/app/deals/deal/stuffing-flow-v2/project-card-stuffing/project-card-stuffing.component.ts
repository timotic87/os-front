import {Component, Input,OnInit} from '@angular/core';
import {CurrencyPipe, DatePipe, NgIf, CommonModule} from "@angular/common";
import {RestService} from "../../../../services/rest.service";
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-project-card-stuffing',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    NgIf,
    CurrencyPipe,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './project-card-stuffing.component.html',
  styleUrl: './project-card-stuffing.component.css'
})
export class ProjectCardStuffingComponent implements OnInit {

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
