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

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './create-project-dialog.component.html',
  styleUrl: './create-project-dialog.component.css'
})
export class CreateProjectDialogComponent implements OnInit {

  createProjectForm: FormGroup
  listLe: LegalEntityModel[] = [];

  currentLe = null;
  currentService= null;
  currentClient = null;

  currentClientList: ClientModel[] = [];

  constructor(public leService: LegalEntityService, private clientService: ClientsService, public SANDS: ServicesAndSubservicesService, private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
              private userService: UserService, public allUsersService: UsersService, private projectService: ProjectService) {
    allUsersService.getUsersByPermision(17);
    this.listLe = leService.getLEList();
  }

  ngOnInit(): void {
        this.createProjectForm = new FormGroup({
          legalEntity: new FormControl(null, [Validators.required]),
          client: new FormControl(null, [Validators.required]),
          service: new FormControl(null, [Validators.required]),
          subservice: new FormControl(null, [Validators.required]),
          comment: new FormControl(null),
          bdUser: new FormControl( null,[Validators.required])
        });


    this.createProjectForm.controls['legalEntity'].valueChanges.subscribe(value=>{
      this.currentLe = value;
      this.SANDS.createListOfServicesForLe(this.currentLe.id).then(()=>{
        if (this.SANDS.servicesForLe.length > 0) {
          this.createProjectForm.controls['service'].setValue(this.SANDS.servicesForLe[0]);
        }
      });
    });

    this.createProjectForm.controls['client'].valueChanges.subscribe(value=>{
      this.currentClientList = this.clientService.getListOfClientsByName(value);
    });
    this.createProjectForm.controls['service'].valueChanges.subscribe(value=>{
      this.currentService = value;
      this.SANDS.createListOfSubervicesForLE(this.currentLe.id, this.currentService.ID).then(()=>{
        if (this.SANDS.subservicesForLe.length > 0) {
          this.createProjectForm.controls['subservice'].setValue(this.SANDS.subservicesForLe[0]);
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

  createProject(){
    if (this.createProjectForm.valid) {
      const data = {legalEntityID: this.createProjectForm.value.legalEntity.id, clientID: this.currentClient.id, serviceID: this.createProjectForm.value.service.ID,
        subserviceID: this.createProjectForm.value.subservice.ID, creatorID: this.userService.getUser().id, BDOwnerID: this.createProjectForm.value.bdUser.id, descriptionText: this.createProjectForm.value.comment}
      this.projectService.createNewProject(data, this.dialogRef)

    }

  }

}
