import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {AsyncPipe, NgClass, NgIf} from "@angular/common";
import {ClientsService} from "../../services/clients.service";
import {CurrencyService} from "../../services/currency.service";
import {MatDialogRef} from "@angular/material/dialog";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {CountryService} from "../../services/country.service";
import {DialogService} from "../../services/dialog.service";
import {ClientModel} from "../../models/clientModel";

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
  currentCountry = ClientModel.createClientModel({
    id: 153,
    name: "Serbia"
  });
  listOfCountry;

  validationTextes = {pib: 'Must have 9 characters and only numbers', mb: 'Must have 8 characters and only numbers', zip: 'Must have 5 characters and only numbers'}

  constructor(public currencyService: CurrencyService, public clientService: ClientsService,
              private dialogRef: MatDialogRef<AddClientDialogComponent>,
              public countryService: CountryService) {
    currencyService.getCurrencyList();
    this.listOfCountry = countryService.getCountryList();
  }

  ngOnInit() {
    this.addClientForm = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.minLength(3)]),
      mb: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
      pib: new FormControl('', [Validators.required, Validators.pattern(/^\d{9}$/)]),
      mail: new FormControl(null, [Validators.required, Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
      country: new FormControl('Serbia', [Validators.required]),
      city: new FormControl(null, [Validators.required, Validators.minLength(5)]),
      address: new FormControl(null, [Validators.required, Validators.minLength(5)]),
      zipCode: new FormControl('', [Validators.required, Validators.pattern(/^\d{5}$/)]),
      currencyId: new FormControl(null, Validators.required)
    });
    this.addClientForm.controls['country'].valueChanges.subscribe(value=>{
      this.listOfCountry = this.countryService.getCountryList().filter(country=>country.name.toLowerCase().includes(value.toLowerCase()))
      console.log(this.listOfCountry)
    });

    this.handleCountryChange();

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

  handleCountryChange() {
    this.addClientForm.get('country')?.valueChanges.subscribe((countryName) => {
      const pib = this.addClientForm.get('pib');
      const mb = this.addClientForm.get('mb');
      const zipCode = this.addClientForm.get('zipCode');

      if (countryName === 'Serbia') {
        this.validationTextes = {pib: 'Must have 9 characters and only numbers', mb: 'Must have 8 characters and only numbers', zip: 'Must have 5 characters and only numbers'}
        pib?.setValidators([Validators.required, Validators.pattern(/^\d{9}$/)]);
        mb?.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
        zipCode?.setValidators([Validators.required, Validators.pattern(/^\d{5}$/)]);
      } else {
        this.validationTextes = {pib: 'You need to have between 8 and 15 characters.', mb: 'You need to have between 6 and 14 characters.', zip: 'You need to have between 4 and 10 characters.'}
        pib?.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{8,15}$/)]);
        mb?.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,14}$/)]);
        zipCode?.setValidators([Validators.required, Validators.pattern(/^[A-Za-z0-9\s\-]{4,10}$/)]);
      }

      pib?.updateValueAndValidity();
      mb?.updateValueAndValidity();
      zipCode?.updateValueAndValidity();
    });
  }

}
