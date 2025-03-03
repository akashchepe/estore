import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

/**
 * Auth Guard to prevent unauthorized access to protected routes.
 * Checks if the user is authenticated; if not, redirects to the login page.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if the user is authenticated
  if (authService.isAuthenticated()) {
    return true;
  } else {
    // Redirect to the login page if not authenticated
    router.navigate(['/login']);
    return false;
  }
};
