import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";
import {ClientsService} from "../../services/clients.service";
import {MatDialogRef} from "@angular/material/dialog";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {RestService} from "../../services/rest.service";
import {debounceTime, distinctUntilChanged, filter, switchMap} from "rxjs";

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
export class AddClientDialogComponent implements OnInit {

  public addClientForm: FormGroup;
  postCodeResults: any[] = [];

  constructor(
    public clientService: ClientsService,
    private dialogRef: MatDialogRef<AddClientDialogComponent>,
    private rest: RestService
  ) {}

  ngOnInit() {
    this.addClientForm = new FormGroup({
      customerName: new FormControl(null, [Validators.required, Validators.minLength(3)]),
      registrationNo: new FormControl(''),
      vatRegistrationNo: new FormControl(''),
      email: new FormControl(null, [Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
      emailInFinance: new FormControl(null, [Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")]),
      phoneInFinance: new FormControl(null),
      zipCode: new FormControl('', [Validators.required, Validators.minLength(4)]),
      city: new FormControl(null, [Validators.required, Validators.minLength(2)]),
      country: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(10)]),
      address: new FormControl(null, [Validators.required, Validators.minLength(5)]),
      // currencyId: new FormControl(null, Validators.required),
    });

    this.setupZipCodeAutocomplete();
    this.setupCountryListener();
  }

  setupCountryListener() {
    this.addClientForm.get('country')?.valueChanges.subscribe(country => {
      const regCtrl = this.addClientForm.get('registrationNo')!;
      const vatCtrl = this.addClientForm.get('vatRegistrationNo')!;
      if (country === 'RS') {
        regCtrl.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$')]);
        vatCtrl.setValidators([Validators.required, Validators.pattern('^[0-9]{9}$')]);
      } else {
        regCtrl.clearValidators();
        vatCtrl.clearValidators();
      }
      regCtrl.updateValueAndValidity();
      vatCtrl.updateValueAndValidity();
    });
  }

  setupZipCodeAutocomplete() {
    this.addClientForm.get('zipCode')?.valueChanges.pipe(
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
    this.addClientForm.patchValue({
      zipCode: postCode.zipCode,
      city: postCode.city,
      country: postCode.country || ''
    });
    this.postCodeResults = [];
  }

  addClient() {
    this.addClientForm.markAllAsTouched();
    if (this.addClientForm.valid) {
      let data = this.addClientForm.value;
      this.clientService.createClient(data);
      this.dialogRef.close();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  isInvalid(field: string): boolean {
    const control = this.addClientForm.get(field);
    return control?.touched && !control?.valid;
  }
}
