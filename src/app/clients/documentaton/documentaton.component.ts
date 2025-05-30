import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {ClientModel} from "../../models/clientModel";
import {PickFileComponent} from "./elements/pick-file/pick-file.component";
import {ChooseDocumentTypeComponent} from "./elements/choose-document-type/choose-document-type.component";
import {ContractDocumentFormComponent} from "./elements/contract-document-form/contract-document-form.component";
import {NgClass, NgIf} from "@angular/common";
import {FormGroup} from "@angular/forms";
import {RestService} from "../../services/rest.service";
import {UserService} from "../../services/user.service";
import {DocumentListComponent} from "./elements/document-list/document-list.component";
import {ClientsService} from "../../services/clients.service";
import {DialogService} from "../../services/dialog.service";
import {ProjectModel} from "../../models/projectModel";
import {Subject} from "rxjs";

@Component({
  selector: 'app-documentaton',
  standalone: true,
  imports: [
    PickFileComponent,
    ChooseDocumentTypeComponent,
    ContractDocumentFormComponent,
    NgIf,
    NgClass,
    DocumentListComponent
  ],
  templateUrl: './documentaton.component.html',
  styleUrl: './documentaton.component.css'
})
export class DocumentatonComponent {

  disableAddDocPage = true;

  isListDocumentsPage = true;

  file: File = null;
  formGroup: FormGroup;
  isTypeValid = false;
  types;

  client: ClientModel;
  project: ProjectModel;

  constructor(@Inject(MAT_DIALOG_DATA) private data: any, private dialog: MatDialog, private rest: RestService,
              private userService: UserService, private clientService: ClientsService, private dialogService: DialogService, private dialogRef: MatDialogRef<DocumentatonComponent>) {
    this.checkPermissions();
    this.client = data.client;
    this.project = data.project;
    clientService.setCurrentClient(this.client);
  }

  typesValid(res){
    this.isTypeValid = res;
  }
  getTypes(obj){
    this.types = obj;
  }

  getFormGroup(formGroup: FormGroup){
    this.formGroup = formGroup;
  }

  itemSelected(event: Event){
    // @ts-ignore
    this.file = event.target.files[0];
  }

  send(){
    let formParams = new FormData();
    formParams.append('file', this.file as File);
    formParams.set('filePath', this.client.name);
    formParams.set('fileName', this.formGroup.get('fileName').value);
    formParams.set('startDate', this.formGroup.get('startDate').value);
    formParams.set('endDate', this.formGroup.get('endDate').value);
    formParams.set('typeID', this.types.type.ID);
    formParams.set('typeName', this.types.type.name);
    formParams.set('subTypeID', this.types.subType? this.types.subType.ID:null);
    formParams.set('subTypeName', this.types.subType? this.types.subType.name:null);
    formParams.set('typeName', this.types.type.typeName);
    formParams.set('subTypeName', this.types.subType? this.types.subType.subTypeName:null);
    formParams.set('notifyBeforeExpiration', (this.formGroup.get('reciveNotification').value? 1:0).toString())
    formParams.set('creatorID', (this.userService.getUser().id).toString());
    formParams.set('clientId', (this.client.id).toString());
    formParams.set('projectID', this.project? (this.project.ID).toString():'null');

    this.rest.saveFile(formParams).subscribe(res => {
      if (res.status === 201) {
        this.dialogService.showSnackBar('Successfully saved document', '',5000);
        this.clientService.addDocumentSub.next(true);

        return;
      }else{
        this.dialogService.errorDialog(res);
        this.dialogRef.close();
      }

      this.dialogService.showSnackBar(res.data.name+' '+res.data.num, '', 5000)
    })
  }

  close(){
    this.dialog.closeAll();
  }

  togglePage(){
    this.isListDocumentsPage = !this.isListDocumentsPage;
  }

  checkPermissions(){
    this.rest.getUserPermissions(this.userService.getUser().id).subscribe(res=>{
      if(res.status===200){
        let permDocAdd = res.data.find(permision => permision.id === 13);
        this.disableAddDocPage = !permDocAdd.userId;
      }
    })
  }

}

