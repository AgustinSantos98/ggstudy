import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';

/**
 * Componente para el panel principal del profesor.
 * 
 * Este componente muestra las opciones disponibles para el rol de profesor,
 * permitiendo acceder a la gestión de alumnos, asignaturas, temas y tareas
 * asignadas al profesor.
 */
@Component({
  selector: 'app-profesor',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './profesor.component.html',
  styleUrl: './profesor.component.css'
})
export class ProfesorComponent {
  /**
   * Constructor del componente del panel de profesor.
   * 
   * @param router Servicio de enrutamiento para la navegación entre componentes
   * @param authService Servicio de autenticación para verificar permisos
   */
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Navega a la ruta especificada.
   * 
   * @param route Ruta a la que se desea navegar
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
