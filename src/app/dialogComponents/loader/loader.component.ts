import {AfterViewInit , Component, ElementRef, Renderer2} from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css'
})
export class LoaderComponent implements AfterViewInit {

  private styleElement: HTMLStyleElement;

  constructor(private renderer: Renderer2, private dialogRef: MatDialogRef<LoaderComponent>) {
  }


  ngAfterViewInit(): void {
    this.styleElement = this.renderer.createElement('style');
    this.styleElement.innerHTML = `
      .mat-mdc-dialog-surface {
        background-color: rgba(255, 255, 255, 0) !important;
        box-shadow: none !important;
      }
    `;
    this.renderer.appendChild(document.head, this.styleElement);

    this.dialogRef.afterClosed().subscribe(() => {
      this.removeStyles();
    });
    }

  ngOnDestroy() {
    this.removeStyles();
  }

  private removeStyles() {
    if (this.styleElement) {
      this.renderer.removeChild(document.head, this.styleElement);
    }
  }

}
