import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { AsignaturaService } from '../../../core/services/asignatura.service';
import { MatriculaService } from '../../../core/services/matricula.service';
import { AuthService } from '../../../core/services/auth.service';
import { Asignatura } from '../../../core/models/asignatura.model';
import { Router } from '@angular/router';

/**
 * Interfaz para representar una asignatura con información del profesor
 */
interface AsignaturaConProfesor extends Asignatura {
  profesor_nombre?: string;
  profesor_apellido?: string;
}

/**
 * Componente para mostrar las asignaturas del alumno y sus profesores asociados.
 */
@Component({
  selector: 'app-mis-asignaturas',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './mis-asignaturas.component.html',
  styleUrl: './mis-asignaturas.component.css'
})
export class MisAsignaturasComponent implements OnInit {
  /**
   * Lista de asignaturas del alumno con información de profesores
   */
  asignaturas: AsignaturaConProfesor[] = [];
  
  /**
   * Indica si se está cargando la información
   */
  cargando: boolean = true;
  
  /**
   * Mensaje de error para mostrar al usuario
   */
  error: string | null = null;
  
  /**
   * ID del curso en el que está matriculado el alumno
   */
  cursoId: number | null = null;

  /**
   * Constructor del componente.
   * 
   * @param asignaturaService Servicio para obtener información de asignaturas
   * @param matriculaService Servicio para obtener información de matrículas
   * @param authService Servicio de autenticación para obtener el usuario actual
   * @param router Servicio para la navegación
   */
  constructor(
    private asignaturaService: AsignaturaService,
    private matriculaService: MatriculaService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicializa el componente y carga las asignaturas del alumno.
   */
  ngOnInit(): void {
    this.cargarCursoYAsignaturas();
  }

  /**
   * Carga el curso del alumno y luego sus asignaturas.
   */
  cargarCursoYAsignaturas(): void {
    this.cargando = true;
    this.error = null;
    
    // Obtener el ID del usuario actual
    const usuarioId = Number(this.authService.getUserId());
    
    if (usuarioId) {
      this.matriculaService.obtenerCursosDeAlumno(usuarioId).subscribe({
        next: (respuesta) => {
          // Tomamos el primer curso de la lista (asumiendo que un alumno solo está matriculado en un curso)
          if (respuesta.data && respuesta.data.length > 0) {
            this.cursoId = respuesta.data[0].id;
            this.cargarAsignaturas();
          } else {
            this.cargando = false;
            this.error = 'No estás matriculado en ningún curso.';
          }
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
   * Carga las asignaturas del curso en el que está matriculado el alumno.
   */
  cargarAsignaturas(): void {
    if (!this.cursoId) {
      this.cargando = false;
      return;
    }

    this.asignaturaService.obtenerAsignaturasPorCurso(this.cursoId).subscribe({
      next: (respuesta) => {
        if (respuesta.data) {
          this.asignaturas = respuesta.data;
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las asignaturas. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener las asignaturas del curso:', err);
      }
    });
  }

  /**
   * Navega a la página de temas de una asignatura específica.
   * 
   * @param asignaturaId ID de la asignatura
   */
  verTemas(asignaturaId: number): void {
    this.router.navigate(['/dashboard/alumno/mis-temas'], { 
      queryParams: { asignaturaId: asignaturaId } 
    });
  }

  /**
   * Navega a la página principal del alumno.
   */
  volver(): void {
    this.router.navigate(['/dashboard/alumno']);
  }
}
