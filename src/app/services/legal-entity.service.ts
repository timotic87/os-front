import { Injectable } from '@angular/core';
import {LegalEntityModel} from "../models/legalEntityModel";
import {RestService} from "./rest.service";
import {CookieService} from "ngx-cookie-service";
import {TokenService} from "./token.service";

@Injectable({
  providedIn: 'root'
})
export class LegalEntityService {

  private _legalEntitiyList: LegalEntityModel[];

  constructor(private rest: RestService, private cookieService: CookieService, private tokenService: TokenService) { }
  getLEList(): LegalEntityModel[]{
    if (!this._legalEntitiyList || this._legalEntitiyList.length<0){
      this.factoryLEFromRest();
      return this._legalEntitiyList
    }else {
      return this._legalEntitiyList
    }
  }

  private factoryLEFromRest(){
    this._legalEntitiyList = [];
    if (this.tokenService.isTokenOk()){
      this.rest.getLEList().subscribe(res=>{
        if (res.status===200){
          for(let i of res.data){
            this._legalEntitiyList.push(LegalEntityModel.createLegalEntity(i));
          }
          return this._legalEntitiyList
        }else {
          return this._legalEntitiyList;
        }
      })
    }
  }
}


