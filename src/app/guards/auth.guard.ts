import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const userService = inject(UserService);
  const router = inject(Router);

  // Check if user has valid token
  if (tokenService.isTokenOk()) {
    return true;
  }

  // Clear any invalid data
  tokenService.deleteToken();
  userService.deleteUser();

  // Redirect to login with return URL
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  
  return false;
};
