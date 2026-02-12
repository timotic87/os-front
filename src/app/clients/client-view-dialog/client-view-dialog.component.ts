import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {ClientsService} from "../../services/clients.service";
import {ClientModel} from "../../models/clientModel";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {DialogService} from "../../services/dialog.service";
import {UserService} from "../../services/user.service";
import {RestService} from "../../services/rest.service";
import {debounceTime, distinctUntilChanged, filter, switchMap} from "rxjs";

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
  postCodeResults: any[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ClientViewDialogComponent>,
              private clientService: ClientsService,
              private dialogService: DialogService, public userService: UserService, private rest: RestService) {
  }


  ngOnInit() {
    this.editClientForm = new FormGroup({
      customerName: new FormControl(this.data.customerName, [Validators.required, Validators.minLength(3)]),
      registrationNo: new FormControl(this.data.registrationNo, [Validators.required, Validators.minLength(6)]),
      vatRegistrationNo: new FormControl(this.data.vatRegistrationNo, [Validators.required, Validators.pattern("^[0-9]{9}$")]),
      email: new FormControl(this.data.email, [Validators.required, Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
      emailInFinance: new FormControl(this.data.emailInFinance, [Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
      phoneInFinance: new FormControl(this.data.phoneInFinance),
      zipCode: new FormControl(this.data.zipCode, [Validators.required, Validators.minLength(4)]),
      city: new FormControl(this.data.city, [Validators.required, Validators.minLength(2)]),
      country: new FormControl(this.data.country, [Validators.required, Validators.minLength(2), Validators.maxLength(10)]),
      address: new FormControl(this.data.address, [Validators.required, Validators.minLength(5)]),
      // currencyId: new FormControl(null, Validators.required),
    });

    this.setupZipCodeAutocomplete();
  }

  setupZipCodeAutocomplete() {
    this.editClientForm.get('zipCode')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => value && value.length >= 2),
      switchMap(value => this.rest.searchPostCodes(value))
    ).subscribe(res => {
      if (res.status === 200) {
        this.postCodeResults = res.data;
      }
    });
  }

  onPostCodeSelect(postCode: any) {
    this.editClientForm.patchValue({
      zipCode: postCode.zipCode,
      city: postCode.city,
      country: postCode.country || ''
    });
    this.postCodeResults = [];
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
    // Mark all fields as touched to show validation
    Object.keys(this.editClientForm.controls).forEach(key => {
      const control = this.editClientForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });

    if (this.editClientForm.valid){
      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      let newData = this.editClientForm.value;
      newData.id = this.data.id;

      this.clientService.editClientById(newData).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.dialogService.forceCloseLoader();

          if (result.success) {
            // Update local data with new values
            Object.assign(this.data, newData);
            this.isEditable = false;
          } else {
            this.dialogService.showMsgDialog('Failed to save changes. Please try again.');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.dialogService.forceCloseLoader();
          this.dialogService.showMsgDialog('An error occurred while saving. Please try again.');
        }
      });
    } else {
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
        ? `Please fix the following fields:\n${invalidFields.join('\n')}`
        : 'You must enter all mandatory fields!';

      this.dialogService.showMsgDialog(errorMessage);
    }

  }

  isInvalid(field: string): boolean {
    const control = this.editClientForm.get(field);
    return control?.touched && !control?.valid;
  }
}
