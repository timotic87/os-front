import {Injectable} from '@angular/core';
import {ClientModel} from "../models/clientModel";
import {TokenService} from "./token.service";
import {CookieService} from "ngx-cookie-service";
import {RestService} from "./rest.service";
import {DialogService} from "./dialog.service";
import {Router} from "@angular/router";
import {Observable, Subject, of, map, catchError} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  public listOfClients: ClientModel[] = [];
  public currentClient: ClientModel;
  isListChange = new Subject<boolean>;
  addDocumentSub = new Subject<boolean>;

  constructor(private tokenService: TokenService, private cookieService: CookieService, private rest: RestService, private dialogService: DialogService,
              private router: Router) {
  }


  getListOfClientsByName(name: string): Observable<ClientModel[]> {
    return this.rest.getClientsByName(name).pipe(
      map(res => {
        if (res.status === 200 && Array.isArray(res.data)) {
          return res.data.map(item => ClientModel.createClientModel(item));
        } else {
          return [];
        }
      })
    );
  }


  editClientById(data) {
    if (this.tokenService.isTokenOk()) {
      this.dialogService.showLoader()
      return this.rest.editClient(data).pipe(
        map(res => {
          // Don't close loader here - let component handle it
          if (res.status === 200) {
            this.isListChange.next(true);
            return { success: true, data: res };
          }
          return { success: false, data: res };
        }),
        catchError(err => {
          // Don't close loader here - let component handle it
          // Don't show error dialog here - let component handle it
          return of({ success: false, error: err });
        })
      );
    } else {
      this.router.navigate(["/login"])
      return of({ success: false, error: 'Not authenticated' });
    }
  }

  deleteClientById({clientId, socketData}) {
    if (this.tokenService.isTokenOk()) {
      this.dialogService.showLoader()
      this.rest.deleteClient({id: clientId, token: this.cookieService.get('jwt'), socketData}).subscribe({
        next: res => {
          if (res.status === 200) {
            this.isListChange.next(true);
            this.dialogService.closeLoader();
            this.dialogService.showSnackBar("You have successfully deleted the client.", "Cancel", 2500);
          }
        }, error: err => {
          this.dialogService.closeLoader();
          this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
        }
      });
    } else {
      this.router.navigate(["/login"])
    }
  }

  createClient(data) {
    this.dialogService.showLoader()
    this.rest.createClient(data).subscribe({
      next: res => {
        if (res.status === 201) {
          this.dialogService.closeLoader()
          this.dialogService.showSnackBar("You are succesfuly create Client", 'Close', 2500)
          this.isListChange.next(true);
        }
      },
      error: err => {
        this.dialogService.closeLoader()
        this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
      }

    })
  }

  setCurrentClient(client) {
    this.currentClient = client
  }
}
