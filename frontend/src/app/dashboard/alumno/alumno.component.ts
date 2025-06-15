import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';

/**
 * Componente para el panel principal del alumno.
 * 
 * Este componente muestra las opciones disponibles para el rol de alumno,
 * permitiendo acceder a la información de su curso, asignaturas, temas
 * y tareas/entregables asignados al alumno.
 */
@Component({
  selector: 'app-alumno',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './alumno.component.html',
  styleUrl: './alumno.component.css'
})
export class AlumnoComponent {
  /**
   * Constructor del componente del panel de alumno.
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
