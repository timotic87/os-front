import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {PickFileComponent} from "../../../../clients/documentaton/elements/pick-file/pick-file.component";

@Component({
  selector: 'app-create-deal-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgClass,
    PickFileComponent
  ],
  templateUrl: './create-deal-dialog.component.html',
  styleUrl: './create-deal-dialog.component.css'
})
export class CreateDealDialogComponent implements OnInit{

  createDealForm: FormGroup;

  offerFIle: File = null;
  contractFile: File = null;

  constructor() { }

  ngOnInit(): void {
        this.createDealForm = new FormGroup({
          offer_number: new FormControl(null, [Validators.required])
        })
    }

  offerSelectDoc(event: Event){
    // @ts-ignore
    this.offerFIle = event.target.files[0];
  }

  contractSelectDoc(event: Event){
    // @ts-ignore
    this.contractFile = event.target.files[0];
  }

}
