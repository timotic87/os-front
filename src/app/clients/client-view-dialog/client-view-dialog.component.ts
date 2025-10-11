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
import {UserService} from "../../services/user.service";

// shadCN UI Components
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../../shared/components/ui/card/card.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { SelectComponent } from '../../shared/components/ui/select/select.component';

@Component({
  selector: 'app-client-view-dialog',
  standalone: true,
  imports: [
    NgIf, 
    ReactiveFormsModule, 
    NgClass, 
    MatAutocompleteTrigger, 
    MatAutocomplete, 
    MatOption,
    // shadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    InputComponent,
    SelectComponent
  ],
  templateUrl: './client-view-dialog.component.html',
  styleUrl: './client-view-dialog.component.css'
})
export class ClientViewDialogComponent implements OnInit {

  isEditable: boolean = false;
  isSaving: boolean = false;
  editClientForm: FormGroup;
  listOfCountry;
  currentCountry;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ClientViewDialogComponent>,
              public currencyService: CurrencyService, private clientService: ClientsService, public countryService: CountryService,
              private dialogService: DialogService, public userService: UserService) {
    currencyService.getCurrencyList()
    this.listOfCountry = countryService.getCountryList();
  }


  ngOnInit() {
    this.editClientForm = new FormGroup({
      name: new FormControl(this.data.name,[Validators.required, Validators.minLength(3)]),
      mb: new FormControl(this.data.mb, [Validators.required, Validators.pattern("^[0-9]{8}$")]),
      pib: new FormControl(this.data.pib, [Validators.required, Validators.pattern("^[0-9]{8}$")]),
      mail: new FormControl(this.data.mail, [Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
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

    if(!this.userService.can('edit_all_clients')){
      this.dialogService.showMsgDialog("You don't have permission to edit the client!!");
      return;
    }

    this.isEditable = !this.isEditable;
  }

  closeEdit(){
    this.isEditable = !this.isEditable;
  }

  sendEdit(){
    console.log('Form validity:', this.editClientForm.valid);
    console.log('Form errors:', this.editClientForm.errors);
    console.log('Form status:', this.editClientForm.status);
    
    // Check each field's validity
    Object.keys(this.editClientForm.controls).forEach(key => {
      const control = this.editClientForm.get(key);
      if (control && control.invalid) {
        console.log(`${key} is invalid:`, control.errors);
        control.markAsTouched(); // Mark as touched to show error
      }
    });
    
    if (this.editClientForm.valid){
      // Prevent multiple save attempts
      if (this.isSaving) {
        return;
      }
      
      this.isSaving = true;
      
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
      
      console.log('Starting edit request...');
      
      // Call edit with direct Observable handling
      this.clientService.editClientById(newData).subscribe({
        next: (result) => {
          console.log('Edit result received:', result);
          console.log('Force closing loader immediately...');
          
          // Reset saving state immediately
          this.isSaving = false;
          
          // Force close loader immediately - this will close all dialogs if needed
          this.dialogService.forceCloseLoader();
          
          if (result.success) {
            // Update local data
            this.data = ClientModel.createClientModel(newData);
            if (this.currentCountry) {
              this.data.country = this.currentCountry;
            }
            // Exit edit mode
            this.isEditable = false;
            console.log('Edit completed successfully');
          } else {
            console.error('Edit failed:', (result as any).error || (result as any).data);
            // Show error dialog
            this.dialogService.showMsgDialog('Failed to save changes. Please try again.');
          }
        },
        error: (err) => {
          console.error('Edit error:', err);
          
          // Reset saving state immediately
          this.isSaving = false;
          
          // Force close loader immediately
          this.dialogService.forceCloseLoader();
          
          // Show error dialog
          this.dialogService.showMsgDialog('An error occurred while saving. Please try again.');
        }
      });
    } else {
      // Show specific field errors
      const invalidFields = Object.keys(this.editClientForm.controls)
        .filter(key => this.editClientForm.get(key)?.invalid)
        .map(key => {
          const control = this.editClientForm.get(key);
          const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
          const errors = control?.errors;
          if (errors?.['required']) return `${fieldName} is required`;
          if (errors?.['minlength']) return `${fieldName} is too short`;
          if (errors?.['pattern']) return `${fieldName} format is invalid`;
          return `${fieldName} is invalid`;
        });
      
      const errorMessage = invalidFields.length > 0 
        ? `Please fix the following fields:\n• ${invalidFields.join('\n• ')}`
        : 'You must enter all mandatory fields!';
        
      this.dialogService.showMsgDialog(errorMessage);
    }

  }

  onCountryClick(country: any) {
    this.currentCountry = country;
  }
}
