import { Injectable } from '@angular/core';
import {CurrencyModel} from "../models/currencyModel";
import {RestService} from "./rest.service";
import {CookieService} from "ngx-cookie-service";
import {TokenService} from "./token.service";

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  private _currencyList: CurrencyModel[];
  constructor(private rest: RestService, private cookieService: CookieService, private tokenService: TokenService) { }

  getCurrencyList(): CurrencyModel[]{
    if (!this._currencyList || this._currencyList.length<0){
      this.factoryCurencyFromRest();
      return this._currencyList
    }else {
      return this._currencyList
    }
  }

  private factoryCurencyFromRest(){
    this._currencyList = [];
    if (this.tokenService.isTokenOk()){
      this.rest.getCurrencyList({token: this.cookieService.get('jwt')}).subscribe(res=>{

        if (res.status===200){
          for(let i of res.data){
            this._currencyList.push(CurrencyModel.createCurrencyModel(i));
          }
          return this._currencyList
        }else {
          return this._currencyList;
        }
      })
    }
  }

}
