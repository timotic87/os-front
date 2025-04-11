import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CurrencyService} from "../../services/currency.service";
import {ClientsService} from "../../services/clients.service";
import {ClientModel} from "../../models/clientModel";
import {CountryService} from "../../services/country.service";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {DialogService} from "../../services/dialog.service";

@Component({
  selector: 'app-client-view-dialog',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, NgClass, MatAutocompleteTrigger, MatAutocomplete, MatOption],
  templateUrl: './client-view-dialog.component.html',
  styleUrl: './client-view-dialog.component.css'
})
export class ClientViewDialogComponent implements OnInit {

  isEditable: boolean = false;
  editClientForm: FormGroup;
  listOfCountry;
  currentCountry;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ClientViewDialogComponent>,
              public currencyService: CurrencyService, private clientService: ClientsService, public countryService: CountryService,
              private dialogService: DialogService) {
    console.log(data)
    currencyService.getCurrencyList()
    this.listOfCountry = countryService.getCountryList();


  }


  ngOnInit() {
    this.editClientForm = new FormGroup({
      name: new FormControl(this.data.name,[Validators.required, Validators.minLength(3)]),
      mb: new FormControl(this.data.mb, [Validators.required, Validators.pattern("^[0-9]{8}$")]),
      pib: new FormControl(this.data.pib, [Validators.required, Validators.pattern("^[0-9]{8}$")]),
      mail: new FormControl(this.data.mail, [Validators.required, Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
      country: new FormControl(this.data.country.name, [Validators.required]),
      city: new FormControl(this.data.city,[Validators.required, Validators.minLength(2)]),
      address: new FormControl(this.data.address, Validators.required),
      zipCode: new FormControl(this.data.zipCode,[Validators.required, Validators.pattern("^[0-9]{5}$")]),
      currencyId: new FormControl(this.data.currency.id, Validators.required),
    });
    this.editClientForm.controls['country'].valueChanges.subscribe(value=>{
      this.listOfCountry = this.countryService.getCountryList().filter(country=>country.name.toLowerCase().includes(value.toLowerCase()))
    })
  }

  closeDialog(){
    this.dialogRef.close();
  }

  editClient(){
    this.isEditable = !this.isEditable;
  }

  closeEdit(){
    this.isEditable = !this.isEditable;
  }

  sendEdit(){
    if (this.editClientForm.valid){
      let newData = this.editClientForm.value;
      newData.id = this.data.id;
      newData.currencyName = this.currencyService.getCurrencyList()[this.editClientForm.value.currencyId-1].name;
      newData.nbsCode = this.currencyService.getCurrencyList()[this.editClientForm.value.currencyId-1].nbsCode;
      newData.currencyId = this.currencyService.getCurrencyList()[this.editClientForm.value.currencyId-1].id;
      if (this.currentCountry){
        newData.countryName = this.currentCountry.name;
        newData.countryId = this.currentCountry.id;
      }else {
        newData.countryId = this.data.country.id;
        newData.countryName = this.data.country.name;
      }
      this.clientService.editClientById(newData);
      this.data = ClientModel.createClientModel(newData)
      if (this.currentCountry){
        this.data.country = this.currentCountry;
      }
      this.isEditable = !this.isEditable
    }else {
      //todo proveriti prevod
      this.dialogService.showMsgDialog('You must enter all mandatory fields!')
    }

  }

  onCountryClick(country: any){
    this.currentCountry = country
  }
}
