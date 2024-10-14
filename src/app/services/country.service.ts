import { Injectable } from '@angular/core';
import {CountryModel} from "../models/countryModel";
import {RestService} from "./rest.service";
import {CookieService} from "ngx-cookie-service";
import {TokenService} from "./token.service";

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  private _countryList: CountryModel[];
  constructor(private rest: RestService, private cookieService: CookieService, private tokenService: TokenService) { }

  getCountryList(): CountryModel[]{
    if (!this._countryList || this._countryList.length<0){
      this.factoryCountryFromRest();
      return this._countryList
    }else {
      return this._countryList
    }
  }

  private factoryCountryFromRest(){
    this._countryList = [];
    if (this.tokenService.isTokenOk()){
      this.rest.getCountryList({token: this.cookieService.get('jwt')}).subscribe(res=>{
        if (res.status===200){
          for(let i of res.data){
            this._countryList.push(CountryModel.createCountryModel(i));
          }
          return this._countryList
        }else {
          return this._countryList;
        }
      })
    }
  }
}
