import {Component, OnInit} from '@angular/core';
import {RestService} from "../services/rest.service";
import {ClientsService} from "../services/clients.service";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {DialogService} from "../services/dialog.service";
import {AddClientDialogComponent} from "./add-client-dialog/add-client-dialog.component";
import {ClientViewDialogComponent} from "./client-view-dialog/client-view-dialog.component";
import {UserService} from "../services/user.service";
import {ErCodesDialogComponent} from "./er-codes-dialog/er-codes-dialog.component";
import {DocumentatonComponent} from "./documentaton/documentaton.component";

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit{

  canViewDocumentation: boolean = false;


  searchText: string = null;

  clientsNumber: number = 50;
  offset: number = 0;
  fullNumber: number = 0;
  maxPages = 1;
  lastItemNumber = 50;
  constructor(private rest: RestService,
              public clientService: ClientsService,private dialog: MatDialog, private dialogService: DialogService,
              private userService: UserService) {
    this.checkPermissions()
    clientService.listOfClients = []
    this.reloadClients();
    clientService.isListChange.subscribe(isTrue=>{
      this.reloadClients()
    })
  }

  ngOnInit(): void {

    }

  onView(client: any){
    this.dialog.open(ClientViewDialogComponent, {
      width: '800px',
      minHeight: '600px',
      data: client
    });
  }

  reloadClients(){
      this.clientsNumber = parseInt(String(this.clientsNumber));
      this.rest.getClients({offset: this.offset*this.clientsNumber, rowsNum: this.clientsNumber, searchName: this.searchText}).subscribe(res=>{
        if(res.status===200) {
          this.fullNumber = res.data[0].full_count;
          //maxpageNumber
          if(this.fullNumber%this.clientsNumber===0){
            this.maxPages = this.fullNumber/this.clientsNumber;
          }else {
            this.maxPages = Math.floor(this.fullNumber/this.clientsNumber) + 1;
          }
          //maxpageNumer end
          //lastItemNumber
          if(this.maxPages===this.offset+1){
            this.lastItemNumber = this.fullNumber
          }else {
            this.lastItemNumber = (this.offset+1)*this.clientsNumber
          }
          //lastItemNumber END
          this.clientService.createListOfClients(res.data);
        }
      })

  }

  onClientsNumberChange(){
    this.offset = 0;
    if(this.maxPages===this.offset+1){
      this.lastItemNumber = this.fullNumber
    }else {
      this.lastItemNumber = (this.offset+1)*this.clientsNumber
    }
    this.reloadClients()
  }
  leftArrow(){
    if (this.offset>0){
      this.offset--;
      this.reloadClients()
    }else {
      //disable dugme
    }
  }
  rightArrow(){
    if (this.offset+1<this.maxPages){
      this.offset++;
      this.reloadClients()
    }
  }

  search(){
    this.reloadClients()
  }

  delete(client){
    this.dialogService.showChooseDialog("Da li ste sigurni da zelite da obrisete ovog klijenta").afterClosed().subscribe(isYes=>{
      if (isYes){
        let data = {clientId: client.id, socketData: undefined}
        data.socketData = {userId: this.userService.getUser().id, userName: this.userService.getUser().fullName ,clientName: client.name}
        this.clientService.deleteClientById(data);
      }
    })
  }

  addClient(){
    this.dialog.open(AddClientDialogComponent, {
      width: '800px',
      minHeight: '600px'
    })
  }

  BCandCPClick(client){
    this.dialog.open(ErCodesDialogComponent, {
      width: '800px',
      minHeight: '600px',
      data: client
    })
  }

  searchEvent(event: Event){
    // @ts-ignore
    if (event.key==='Enter'){
      this.search();
    }
  }

  openDocumentationDialog(client){
    if (!this.canViewDocumentation){
      this.dialogService.showMsgDialog("You don't have permission");
      return;
    }
    this.dialog.open(DocumentatonComponent, {
      minWidth: '900px',
      maxHeight: '700px',
      data: {client, project: null}
    });
  }


  checkPermissions(){
    this.rest.getUserPermisions(this.userService.getUser().id).subscribe(res=>{
      if(res.status===200){
        let permDocView = res.data.find(permision => permision.id === 12);
        this.canViewDocumentation = permDocView.userId;
      }
    })
  }

}
