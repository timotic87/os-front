import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private cookieService: CookieService,
    private tokenService: TokenService,
    private userService: UserService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token check for login endpoint
    if (request.url.includes('/login')) {
      return next.handle(request);
    }

    // Check if token exists and is valid
    if (!this.tokenService.isTokenOk()) {
      this.handleTokenExpiration();
      return throwError(() => new Error('Token expired or missing'));
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired on server side
          this.handleTokenExpiration();
        } else if (error.status === 403) {
          console.warn('Access forbidden:', error.message);
        }
        return throwError(() => error);
      })
    );
  }

  private handleTokenExpiration(): void {
    // Clear user data and tokens
    this.tokenService.deleteToken();
    this.userService.deleteUser();
    
    // Redirect to login
    this.router.navigate(['/login']);
  }
}
