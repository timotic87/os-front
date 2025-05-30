import {Component, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {LegalEntityService} from "../../services/legal-entity.service";
import {LegalEntityModel} from "../../models/legalEntityModel";
import {ClientsService} from "../../services/clients.service";
import {ClientModel} from "../../models/clientModel";
import {ServicesAndSubservicesService} from "../../services/services-and-subservices.service";
import {MatDialogRef} from "@angular/material/dialog";
import {UserService} from "../../services/user.service";
import {UsersService} from "../../services/users.service";
import {ProjectService} from "../../services/project.service";
import {RestService} from "../../services/rest.service";

@Component({
  selector: 'app-promoting-project',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './create-deal-dialog.component.html',
  styleUrl: './create-deal-dialog.component.css'
})
export class CreateDealDialogComponent implements OnInit {

  createDealForm: FormGroup
  listLe: LegalEntityModel[] = [];

  currentLe = null;
  currentService= null;
  currentClient = null;

  currentClientList: ClientModel[] = [];

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
          comment: new FormControl(null),
          bdUser: new FormControl( null,[Validators.required])
        });


    this.createDealForm.controls['legalEntity'].valueChanges.subscribe(value=>{
      this.currentLe = value;
      this.SANDS.createListOfServicesForLe(this.currentLe.id).then(()=>{
        if (this.SANDS.servicesForLe.length > 0) {
          this.createDealForm.controls['service'].setValue(this.SANDS.servicesForLe[0]);
        }
      });
    });

    this.createDealForm.controls['client'].valueChanges.subscribe(value=>{
      this.currentClientList = this.clientService.getListOfClientsByName(value);
    });
    this.createDealForm.controls['service'].valueChanges.subscribe(value=>{
      this.currentService = value;
      this.SANDS.createListOfSubervicesForLE(this.currentLe.id, this.currentService.ID).then(()=>{
        if (this.SANDS.subservicesForLe.length > 0) {
          this.createDealForm.controls['subservice'].setValue(this.SANDS.subservicesForLe[0]);
        }
      });
    });
    }


  closeDialog(){
    this.dialogRef.close()
  }

  onClientClick(client){
    this.currentClient = client;
  }

  createDeal(){
    if (this.createDealForm.valid) {
      const data = {legalEntityID: this.createDealForm.value.legalEntity.id, clientID: this.currentClient.id, serviceID: this.createDealForm.value.service.ID,
        subserviceID: this.createDealForm.value.subservice.ID, subserviceType: this.createDealForm.value.subservice.typeID, creatorID: this.userService.getUser().id, BDOwnerID: this.createDealForm.value.bdUser.id, descriptionText: this.createDealForm.value.comment}
      this.rest.createDeal(data).subscribe(res=>{
        if (res.status == 200) {
          this.dialogRef.close(res.status);
        }
      });


      }

  }

}
