import { Injectable } from '@angular/core';
import {ClientModel} from "../models/clientModel";
import {TokenService} from "./token.service";
import {CookieService} from "ngx-cookie-service";
import {RestService} from "./rest.service";
import {DialogService} from "./dialog.service";
import {Router} from "@angular/router";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  public listOfClients: ClientModel[]=[];
  public  currentClient: ClientModel;
  isListChange = new Subject<boolean>;
  addDocumentSub = new Subject<boolean>;

  constructor(private tokenService: TokenService, private cookieService: CookieService, private rest: RestService, private dialogService: DialogService,
              private router: Router) {
  }

  getListOfClientsByName(name: string): ClientModel[]{
    let clients: ClientModel[] = [];
    // @ts-ignore
    this.rest.getClientsByName(name).subscribe(res=>{
      if (res.status == 200){
        if (res.data.length === 0){
          return clients
        }
        for (let item of res.data) {
          clients.push(ClientModel.createClientModel(item));
        }
        return clients;
      }
    });
    return clients;
  }

  editClientById(data){
    if (this.tokenService.isTokenOk()){
      this.dialogService.showLoader()
      this.rest.editClient(data).subscribe(res=>{
        this.dialogService.closeLoader()
        if (res.status===200){
          this.isListChange.next(true);
        }
      })
    }else {
      this.router.navigate(["/login"])
    }
  }

  deleteClientById({clientId, socketData}){
    if (this.tokenService.isTokenOk()){
      this.dialogService.showLoader()
      this.rest.deleteClient({id: clientId, token: this.cookieService.get('jwt'), socketData}).subscribe(res=>{
        console.log(res)
        this.dialogService.closeLoader();
        if (res.status===200){

          this.isListChange.next(true);
          //todo PREVOD
          this.dialogService.showSnackBar("Uspesno obrisan client", "Cancel", 25);
        }else {
          this.dialogService.showMsgDialog(res.msg);
        }
      });
    }else {
      this.router.navigate(["/login"])
    }
  }

  createClient(data){
      this.dialogService.showLoader()
      this.rest.createClient(data).subscribe(res=>{
        console.log(res)
        this.dialogService.closeLoader()
        if (res.status===201){
          this.isListChange.next(true);
          this.dialogService.showSnackBar("You are succesfuly create Client", 'Close', 2500)
        }else {
          this.dialogService.showMsgDialog(`code: ${res.status} msg: ${res.msg}`);
        }
      })
  }

  setCurrentClient(client){
    this.currentClient = client
  }
}
