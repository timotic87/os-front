import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtDecoderService {

  constructor() { }

  public decodeToken(token: string){
    const base64Url: string = token.split('.')[1];
    const base64: string = base64Url.replace(/-/g, '+').replace(/_/g, '-');
    const jsonPlayload: string = decodeURIComponent(
      atob(base64)
        .split('').map((c)=>{
          return '%'+('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPlayload);
  }
}
