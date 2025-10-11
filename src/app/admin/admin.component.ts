import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {relative} from "@angular/compiler-cli";

// shadCN UI Components
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../shared/components/ui/card/card.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    RouterLinkActive,
    RouterLink,
    RouterOutlet,
    // shadCN UI Components
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  @ViewChild('usersBtn') usersBtn: ElementRef;

  constructor(private router: Router){

  }

  ngOnInit(): void {
    setTimeout(() => {
      this.usersBtn.nativeElement.click();
    }, 1);

    }
}
