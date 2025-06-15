import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { TemaService } from '../../../core/services/tema.service';
import { AsignaturaService } from '../../../core/services/asignatura.service';
import { EntregaService } from '../../../core/services/entrega.service';
import { AuthService } from '../../../core/services/auth.service';
import { Tema } from '../../../core/models/tema.model';
import { Asignatura } from '../../../core/models/asignatura.model';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/**
 * Interfaz extendida para representar un tema con información adicional
 */
interface TemaExtendido extends Tema {
  tema_nombre?: string;
  asignatura_nombre?: string;
  curso_id?: number;
  curso_nombre?: string;
  tareasCount?: number;
  tareasPendientes?: number;
}

/**
 * Componente para mostrar los temas de las asignaturas del alumno.
 */
@Component({
  selector: 'app-mis-temas',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './mis-temas.component.html',
  styleUrl: './mis-temas.component.css'
})
export class MisTemasComponent implements OnInit {
  /**
   * Lista de temas de la asignatura seleccionada
   */
  temas: TemaExtendido[] = [];
  
  /**
   * Asignatura seleccionada
   */
  asignaturaSeleccionada: Asignatura | null = null;
  
  /**
   * ID de la asignatura seleccionada
   */
  asignaturaId: number | null = null;
  
  /**
   * Indica si se está cargando la información
   */
  cargando: boolean = true;
  
  /**
   * Mensaje de error para mostrar al usuario
   */
  error: string | null = null;
  
  /**
   * URL base de la API
   */
  private apiUrl = 'http://localhost:3000/api';

  /**
   * Constructor del componente.
   * 
   * @param temaService Servicio para obtener información de temas
   * @param asignaturaService Servicio para obtener información de asignaturas
   * @param authService Servicio de autenticación para obtener el usuario actual
   * @param router Servicio para la navegación
   * @param route Servicio para obtener parámetros de la ruta
   */
  constructor(
    private temaService: TemaService,
    private asignaturaService: AsignaturaService,
    private entregaService: EntregaService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  /**
   * Inicializa el componente y carga los temas de la asignatura seleccionada.
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['asignaturaId']) {
        this.asignaturaId = +params['asignaturaId'];
        this.cargarAsignaturaYTemas();
      } else {
        this.cargando = false;
        this.error = 'No se ha seleccionado ninguna asignatura.';
      }
    });
  }

  /**
   * Carga la información de la asignatura seleccionada y sus temas.
   */
  cargarAsignaturaYTemas(): void {
    this.cargando = true;
    this.error = null;
    
    if (!this.asignaturaId) {
      this.cargando = false;
      this.error = 'No se ha seleccionado ninguna asignatura.';
      return;
    }

    // Primero obtenemos la información de la asignatura
    this.asignaturaService.obtenerAsignaturaPorId(this.asignaturaId).subscribe({
      next: (respuesta: any) => {
        // Manejar diferentes formatos de respuesta
        if (respuesta.data) {
          this.asignaturaSeleccionada = respuesta.data;
        } else {
          this.asignaturaSeleccionada = respuesta;
        }
        
        // Ahora cargamos los temas de la asignatura
        this.cargarTemas();
      },
      error: (err) => {
        this.error = 'Error al cargar la información de la asignatura. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener la asignatura:', err);
      }
    });
  }

  /**
   * Carga los temas de la asignatura seleccionada.
   */
  cargarTemas(): void {
    if (!this.asignaturaId) {
      this.cargando = false;
      return;
    }

    this.temaService.obtenerTemasPorAsignatura(this.asignaturaId).subscribe({
      next: (respuesta: any) => {
        // Manejar diferentes formatos de respuesta
        if (respuesta.data) {
          this.temas = respuesta.data.map((tema: any) => ({
            ...tema,
            // Asegurar que usamos la propiedad correcta para el nombre del tema
            nombre: tema.nombre || tema.tema_nombre
          }));
        } else if (Array.isArray(respuesta)) {
          this.temas = respuesta.map((tema: any) => ({
            ...tema,
            nombre: tema.nombre || tema.tema_nombre
          }));
        } else {
          this.temas = [];
        }
        
        // Cargar información de tareas para cada tema
        this.cargarTareasPorTema();
        
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los temas. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener los temas de la asignatura:', err);
      }
    });
  }

  /**
   * Navega a la página de tareas de un tema específico.
   * 
   * @param temaId ID del tema
   */
  verTareas(temaId: number): void {
    this.router.navigate(['/dashboard/alumno/mis-entregables'], { 
      queryParams: { temaId: temaId } 
    });
  }

  /**
   * Navega a la página de asignaturas del alumno.
   */
  volverAAsignaturas(): void {
    this.router.navigate(['/dashboard/alumno/mis-asignaturas']);
  }
  
  /**
   * Navega a la página principal del alumno.
   */
  volver(): void {
    this.router.navigate(['/dashboard/alumno']);
  }
  
  /**
   * Carga la información de tareas para cada tema.
   */
  cargarTareasPorTema(): void {
    // Obtener el ID del usuario actual
    const usuarioId = this.authService.getUserId();
    if (!usuarioId) {
      console.error('No se pudo obtener el ID del usuario actual');
      return;
    }

    // Para cada tema, obtener el número de tareas y tareas pendientes
    this.temas.forEach(tema => {
      // Inicializar contadores
      tema.tareasCount = 0;
      tema.tareasPendientes = 0;
      
      // Obtener tareas del tema
      this.http.get<any>(`${this.apiUrl}/temas/${tema.id}/tareas`).subscribe({
        next: (respuestaTareas) => {
          let tareas: any[] = [];
          
          // Normalizar el formato de respuesta
          if (respuestaTareas && respuestaTareas.data) {
            tareas = respuestaTareas.data;
          } else if (Array.isArray(respuestaTareas)) {
            tareas = respuestaTareas;
          }
          
          // Actualizar el contador total de tareas
          tema.tareasCount = tareas.length;
          
          if (tareas.length === 0) return;
          
          // Obtener las entregas del alumno usando el servicio EntregaService
          this.entregaService.obtenerMisEntregas().subscribe({
            next: (respuestaEntregas) => {
              let entregas: any[] = [];
              
              // Normalizar el formato de respuesta de entregas
              if (respuestaEntregas && respuestaEntregas.data) {
                entregas = respuestaEntregas.data;
              } else if (Array.isArray(respuestaEntregas)) {
                entregas = respuestaEntregas;
              }
              
              // Mapear las entregas por ID de tarea para búsqueda rápida
              const entregasPorTarea = new Map();
              entregas.forEach((entrega: any) => {
                entregasPorTarea.set(entrega.tarea_id, entrega);
              });
              
              // Contar tareas pendientes (aquellas que no tienen entrega)
              // Asegurarse de que tareasPendientes esté inicializado
              if (tema.tareasPendientes === undefined) {
                tema.tareasPendientes = 0;
              }
              
              // Reiniciar el contador para este tema
              tema.tareasPendientes = 0;
              
              // Recorrer todas las tareas del tema
              tareas.forEach((tarea: any) => {
                // Verificar si existe una entrega para esta tarea
                const entrega = entregasPorTarea.get(tarea.id);
                
                // Una tarea está pendiente si no tiene entrega
                if (!entrega) {
                  // Asegurarse de que tareasPendientes está definido antes de incrementarlo
                  if (tema.tareasPendientes !== undefined) {
                    tema.tareasPendientes++;
                  }
                }
              });
              
              // Actualizar el contador en la interfaz
              if (tema.tareasPendientes !== undefined && tema.tareasCount !== undefined) {
                console.log(`Tema ${tema.nombre}: ${tema.tareasPendientes} tareas pendientes de ${tema.tareasCount} totales`);
              }
            },
            error: (err) => {
              console.error(`Error al obtener entregas para el usuario ${usuarioId}:`, err);
            }
          });
        },
        error: (err) => {
          console.error(`Error al obtener tareas para el tema ${tema.id}:`, err);
        }
      });
    });
  }

}

