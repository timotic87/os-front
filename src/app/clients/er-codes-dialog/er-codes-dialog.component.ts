import {Component, Inject} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgIf} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {LegalEntityService} from "../../services/legal-entity.service";

@Component({
  selector: 'app-er-codes-dialog',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './er-codes-dialog.component.html',
  styleUrl: './er-codes-dialog.component.css'
})
export class ErCodesDialogComponent {

  showInputs = false;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private legalEntityService: LegalEntityService) {
    this.legalEntityService.getLEList();

  }

  addBCCP(){
    this.showInputs = !this.showInputs;
    console.log(this.showInputs)
  }

  logEvent(event){
    console.log(event)
  }
}
