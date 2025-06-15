import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guardia que protege las rutas que requieren que el usuario tenga el rol de profesor.
 * 
 * Este guardia verifica si el usuario ha iniciado sesión y tiene el rol de profesor
 * antes de permitir el acceso a una ruta. Si el usuario no cumple con estos requisitos,
 * será redirigido automáticamente a la página principal del dashboard.
 */
@Injectable({
  providedIn: 'root'
})
export class ProfesorGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Verifica si el usuario puede activar (acceder a) la ruta solicitada.
   * 
   * @returns true si el usuario está autenticado y tiene rol de profesor, false en caso contrario
   */
  canActivate(): boolean {
    const isAuthenticated = this.authService.isAuthenticated();
    const userRole = this.authService.getUserRole();
    
    if (isAuthenticated && (userRole === 'profesor' || userRole === 'admin')) {
      return true;
    }
    
    // Si no está autenticado o no es profesor, redirigir al dashboard
    this.router.navigate(['/dashboard']);
    return false;
  }
}
