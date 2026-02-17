import {Component, OnInit} from '@angular/core';
import {RestService} from "../services/rest.service";
import {ClientsService} from "../services/clients.service";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from '@angular/common';
import {MatDialog} from "@angular/material/dialog";
import {DialogService} from "../services/dialog.service";
import {AddClientDialogComponent} from "./add-client-dialog/add-client-dialog.component";
import {ClientViewDialogComponent} from "./client-view-dialog/client-view-dialog.component";
import {UserService} from "../services/user.service";
import {ErCodesDialogComponent} from "./er-codes-dialog/er-codes-dialog.component";
import {DocumentatonComponent} from "./documentaton/documentaton.component";

// shadCN UI Components
import { ButtonComponent } from '../shared/components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent } from '../shared/components/ui/card/card.component';
import { InputComponent } from '../shared/components/ui/input/input.component';
import { SelectComponent } from '../shared/components/ui/select/select.component';
import { TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent } from '../shared/components/ui/table/table.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    // Dialog Components
    ClientViewDialogComponent,
    // shadCN UI Components
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    InputComponent,
    SelectComponent,
    TableComponent,
    TableHeaderComponent,
    TableBodyComponent,
    TableRowComponent,
    TableHeadComponent,
    TableCellComponent
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
              public userService: UserService) {
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

  reloadClients(): void {
    this.dialogService.showLoader();

    const offsetValue = this.offset * this.clientsNumber;

    this.rest.getClients({
      offset: offsetValue,
      rowsNum: this.clientsNumber,
      searchName: this.searchText?.trim() || null
    }).subscribe({
      next: res => {
        if (res.status === 200) {
          this.clientService.listOfClients = res.data;
          this.fullNumber = res.totalCount;
          this.maxPages = Math.ceil(this.fullNumber / this.clientsNumber);
          this.lastItemNumber = Math.min((this.offset + 1) * this.clientsNumber, this.fullNumber);
        }
      },
      error: err => {
        this.dialogService.closeLoader();
        this.dialogService.showMsgDialog('Error loading clients: ' + (err.error?.message || err.status));
      },
      complete: () => {
        this.dialogService.closeLoader();
      }
    });
  }



  onClientsNumberChange(){
    // Convert to number since select returns string
    this.clientsNumber = Number(this.clientsNumber);
    this.offset = 0;
    this.reloadClients();
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

    if (!this.userService.can('delete_client')){
      this.dialogService.showMsgDialog("You dont have permission to delete client");
      return;
    }

    this.dialogService.showChooseDialog("Are you sure you want to delete this client?").afterClosed().subscribe(isYes=>{
      if (isYes){
        let data = {clientId: client.id, socketData: undefined}
        data.socketData = {userId: this.userService.getUser().id, userName: this.userService.getUser().fullName ,clientName: client.customerName}
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
    this.rest.getUserPermissions(this.userService.getUser().id).subscribe(res=>{
      if(res.status===200){
        let permDocView = res.data.find(permision => permision.id === 12);
        this.canViewDocumentation = permDocView.userId;
      }
    })
  }

  // Statistics methods for dashboard cards
  getTotalClientsCount(): number {
    // ✅ ACCURATE: Returns actual total count from backend
    return this.fullNumber || 0;
  }

  getActiveClientsCount(): number {
    // ❌ PLACEHOLDER: Backend doesn't track "active" clients
    // TODO: Define what "active" means (e.g., clients with recent deals, projects, or activity)
    // For now, returning 0 as placeholder until proper logic is implemented
    return 0;
  }

  getNewClientsCount(): number {
    // ❌ NOT AVAILABLE: Backend client model has `timestamps: false`
    // No createdAt field exists in the database
    // TODO: To implement this feature:
    // 1. Add `timestamps: true` to backend client model
    // 2. Create migration to add createdAt/updatedAt columns
    // 3. Update backend service to filter by createdAt >= 30 days ago
    // 4. Add new endpoint like /api/clients/stats/recent?days=30
    
    // For now, returning 0 as this data is not available
    return 0;
  }

  // Clear search functionality
  clearSearch(): void {
    this.searchText = '';
    this.offset = 0;
    this.reloadClients();
  }

  // Helper methods for pagination display
  getStartItemNumber(): number {
    if (this.getTotalClientsCount() === 0) return 0;
    return (this.offset * this.clientsNumber) + 1;
  }

  getEndItemNumber(): number {
    const totalCount = this.getTotalClientsCount();
    if (totalCount === 0) return 0;
    return Math.min((this.offset + 1) * this.clientsNumber, totalCount);
  }

}
