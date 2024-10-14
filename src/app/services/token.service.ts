import { Injectable } from '@angular/core';
import {CookieService} from "ngx-cookie-service";
import {JwtDecoderService} from "./jwt-decoder.service";

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor(private cookieService: CookieService, private jwtDecoderService: JwtDecoderService) { }

  public isTokenExp(){
    if (this.isTokenExist()){
      return this.jwtDecoderService.decodeToken(this.cookieService.get('jwt')).exp*1000<Date.now();
    }else return false;
  }

  public isTokenExist(){
    return this.cookieService.get('jwt');

  }

  public isTokenOk(){
    return this.isTokenExist() && !this.isTokenExp();
  }

  public deleteToken(){
    this.cookieService.delete('jwt');
  }
}
