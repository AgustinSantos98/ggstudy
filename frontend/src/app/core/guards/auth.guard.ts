import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guardia de autenticación que protege las rutas que requieren que el usuario esté autenticado.
 * 
 * Este guardia verifica si el usuario ha iniciado sesión antes de permitir el acceso a una ruta.
 * Si el usuario no está autenticado, será redirigido automáticamente a la página de inicio de sesión.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Verifica si el usuario puede activar (acceder a) la ruta solicitada.
   * 
   * @returns true si el usuario está autenticado, false en caso contrario
   */
  canActivate(): boolean {
    const isAuthenticated = this.authService.isAuthenticated();
    if (isAuthenticated) {
      return true;
    }
    // Si no está autenticado, redirigir al login
    this.router.navigate(['/login']);
    return false;
  }
} 