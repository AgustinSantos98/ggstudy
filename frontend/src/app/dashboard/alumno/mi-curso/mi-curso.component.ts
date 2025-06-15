import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { MatriculaService } from '../../../core/services/matricula.service';
import { AuthService } from '../../../core/services/auth.service';
import { Curso } from '../../../core/models/curso.model';
import { Router } from '@angular/router';

/**
 * Componente para mostrar la información del curso en el que está matriculado el alumno.
 */
@Component({
  selector: 'app-mi-curso',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './mi-curso.component.html',
  styleUrl: './mi-curso.component.css'
})
export class MiCursoComponent implements OnInit {
  /**
   * Curso en el que está matriculado el alumno
   */
  curso: Curso | null = null;
  
  /**
   * Indica si se está cargando la información
   */
  cargando: boolean = true;
  
  /**
   * Mensaje de error para mostrar al usuario
   */
  error: string | null = null;

  /**
   * Constructor del componente.
   * 
   * @param matriculaService Servicio para obtener información de matrículas
   * @param authService Servicio de autenticación para obtener el usuario actual
   * @param router Servicio para la navegación
   */
  constructor(
    private matriculaService: MatriculaService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicializa el componente y carga el curso del alumno.
   */
  ngOnInit(): void {
    this.cargarCursoAlumno();
  }

  /**
   * Carga la información del curso en el que está matriculado el alumno.
   */
  cargarCursoAlumno(): void {
    this.cargando = true;
    this.error = null;
    
    // Obtener el ID del usuario actual
    const usuarioId = Number(this.authService.getUserId());
    
    if (usuarioId) {
      this.matriculaService.obtenerCursosDeAlumno(usuarioId).subscribe({
        next: (respuesta) => {
          // Tomamos el primer curso de la lista (asumiendo que un alumno solo está matriculado en un curso)
          if (respuesta.data && respuesta.data.length > 0) {
            this.curso = respuesta.data[0];
          }
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error al cargar la información del curso. Por favor, inténtalo de nuevo más tarde.';
          this.cargando = false;
          console.error('Error al obtener el curso del alumno:', err);
        }
      });
    } else {
      this.error = 'No se ha podido identificar al usuario actual.';
      this.cargando = false;
    }
  }

  /**
   * Navega a la página de asignaturas del alumno.
   */
  verAsignaturas(): void {
    this.router.navigate(['/dashboard/alumno/mis-asignaturas']);
  }

  /**
   * Navega a la página principal del alumno.
   */
  volver(): void {
    this.router.navigate(['/dashboard/alumno']);
  }
}
