import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {AsyncPipe, NgClass, NgIf} from "@angular/common";
import {ClientsService} from "../../services/clients.service";
import {CurrencyService} from "../../services/currency.service";
import {MatDialogRef} from "@angular/material/dialog";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {CountryService} from "../../services/country.service";
import {DialogService} from "../../services/dialog.service";

@Component({
  selector: 'app-add-client-dialog',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    NgClass,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption
  ],
  templateUrl: './add-client-dialog.component.html',
  styleUrl: './add-client-dialog.component.css'
})
export class AddClientDialogComponent implements OnInit{

  public addClientForm:FormGroup;
  currentCountry;
  listOfCountry;
  constructor(public currencyService: CurrencyService, public clientService: ClientsService,
              private dialogRef: MatDialogRef<AddClientDialogComponent>,
              public countryService: CountryService) {
    currencyService.getCurrencyList();
    this.listOfCountry = countryService.getCountryList();
  }

  ngOnInit() {
    this.addClientForm = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.minLength(3)]),
      mb: new FormControl(null, [Validators.required, Validators.pattern("^[0-9]{8}$")]),
      pib: new FormControl(null, [Validators.required, Validators.pattern("^[0-9]{8}$")]),
      mail: new FormControl(null, [Validators.required, Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
      country: new FormControl(null, [Validators.required]),
      city: new FormControl(null, [Validators.required, Validators.minLength(2)]),
      address: new FormControl(null, Validators.required),
      zipCode: new FormControl(null, [Validators.required, Validators.pattern("^[0-9]{5}$")]),
      currencyId: new FormControl(null, Validators.required)
    });
    this.addClientForm.controls['country'].valueChanges.subscribe(value=>{
      this.listOfCountry = this.countryService.getCountryList().filter(country=>country.name.toLowerCase().includes(value.toLowerCase()))
    })
  }

  addClient(){
    if (this.addClientForm.valid){
      let data = this.addClientForm.value;
      data.countryId = this.currentCountry.id;
      this.clientService.createClient(data);
      this.dialogRef.close();
    }

  }

  closeDialog(){
    this.dialogRef.close();
  }
  onCountryClick(country){
    this.currentCountry = country
  }
}
