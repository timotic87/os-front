import {Component, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {CommonModule} from "@angular/common";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {LegalEntityService} from "../../services/legal-entity.service";
import {LegalEntityModel} from "../../models/legalEntityModel";
import {ClientsService} from "../../services/clients.service";
import {ServicesAndSubservicesService} from "../../services/services-and-subservices.service";
import {MatDialogRef} from "@angular/material/dialog";
import {UserService} from "../../services/user.service";
import {UsersService} from "../../services/users.service";
import {RestService} from "../../services/rest.service";
import {MatMenuModule} from "@angular/material/menu";

// ShadCN UI Components
import {ButtonComponent} from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-promoting-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatMenuModule,
    ButtonComponent
  ],
  templateUrl: './create-deal-dialog.component.html',
  styleUrl: './create-deal-dialog.component.css'
})
export class CreateDealDialogComponent implements OnInit {

  isLoading = false;

  createDealForm: FormGroup;
  listLe: LegalEntityModel[] = [];

  currentLe = null;
  currentService = null;
  currentClient = null;

  currentClientList = [];

  // BD Consultant search
  selectedBdUser: any = null;
  bdSearch = '';
  filteredBdUsers: any[] = [];

  constructor(public leService: LegalEntityService, private clientService: ClientsService, public SANDS: ServicesAndSubservicesService, private dialogRef: MatDialogRef<CreateDealDialogComponent>,
              private userService: UserService, public allUsersService: UsersService, private rest: RestService) {
    allUsersService.getUsersByPermission(4);
    this.listLe = leService.getLEList();
  }

  ngOnInit(): void {
    this.createDealForm = new FormGroup({
      legalEntity: new FormControl(null, [Validators.required]),
      client: new FormControl(null, [Validators.required]),
      service: new FormControl(null, [Validators.required]),
      subservice: new FormControl(null, [Validators.required]),
      initialComment: new FormControl(null),
      bdUser: new FormControl(null, [Validators.required])
    });

    this.createDealForm.controls['legalEntity'].valueChanges.subscribe(value => {
      this.currentLe = value;
      this.SANDS.createListOfServicesForLe(this.currentLe.id).then(() => {
        if (this.SANDS.servicesForLe.length > 0) {
          this.createDealForm.controls['service'].setValue(this.SANDS.servicesForLe[0]);
        }
      });
    });

    this.createDealForm.controls['client'].valueChanges.subscribe(value => {
      if (typeof value === 'string' && value.trim().length > 1) {
        this.clientService.getListOfClientsByName(value.trim()).subscribe(clients => {
          this.currentClientList = clients;
        });
      } else {
        this.currentClientList = [];
      }
    });

    this.createDealForm.controls['service'].valueChanges.subscribe(value => {
      this.currentService = value;
      this.SANDS.createListOfSubervicesForLE(this.currentLe.id, this.currentService.ID).then(() => {
        if (this.SANDS.subservicesForLe.length > 0) {
          this.createDealForm.controls['subservice'].setValue(this.SANDS.subservicesForLe[0]);
        }
      });
    });

    // Initialize BD users list once loaded
    this.waitForBdUsers();
  }

  private waitForBdUsers(): void {
    const check = setInterval(() => {
      if (this.allUsersService.usersListByPermision && this.allUsersService.usersListByPermision.length > 0) {
        this.filteredBdUsers = [...this.allUsersService.usersListByPermision];
        clearInterval(check);
      }
    }, 200);
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(check), 10000);
  }

  filterBdUsers(search: string): void {
    const users = this.allUsersService.usersListByPermision || [];
    if (!search) {
      this.filteredBdUsers = [...users];
      return;
    }
    const s = search.toLowerCase();
    this.filteredBdUsers = users.filter((u: any) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
      u.fullName?.toLowerCase().includes(s)
    );
  }

  selectBdUser(user: any): void {
    this.selectedBdUser = user;
    this.createDealForm.controls['bdUser'].setValue(user);
    this.bdSearch = '';
    this.filterBdUsers('');
  }

  closeDialog() {
    this.dialogRef.close();
  }

  onClientClick(client) {
    this.currentClient = client;
  }

  createDeal() {
    if (this.createDealForm.valid) {
      const data = {
        legalEntityID: this.createDealForm.value.legalEntity.id,
        clientID: this.currentClient.id,
        serviceID: this.createDealForm.value.service.ID,
        subserviceID: this.createDealForm.value.subservice.ID,
        subserviceType: this.createDealForm.value.subservice.typeID,
        creatorID: this.userService.getUser().id,
        BDOwnerID: this.createDealForm.value.bdUser.id,
        initialComment: this.createDealForm.value.initialComment || null
      };
      this.rest.createDeal(data).subscribe(res => {
        if (res.status == 200) {
          this.dialogRef.close(res.status);
        }
      });
    } else {
      this.createDealForm.markAllAsTouched();
    }
  }
}
