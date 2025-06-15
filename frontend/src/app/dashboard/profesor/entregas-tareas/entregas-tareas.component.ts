import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { HeaderComponent } from '../../../shared/header/header.component';
import { AuthService } from '../../../core/services/auth.service';
import { EntregaService } from '../../../core/services/entrega.service';
import { TareaService } from '../../../core/services/tarea.service';
import { UsuarioService, RespuestaPaginada } from '../../../core/services/usuario.service';
import { AsignaturaService } from '../../../core/services/asignatura.service';

import { TareaCalificacion, TareaCalificacionExtendida } from '../../../core/models/tarea-calificacion.model';
import { Tarea } from '../../../core/models/tarea.model';
import { Usuario } from '../../../core/models/usuario.model';
import { Asignatura } from '../../../core/models/asignatura.model';

@Component({
  selector: 'app-entregas-tareas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './entregas-tareas.component.html',
  styleUrls: ['./entregas-tareas.component.css', '../../../shared/admin-common.css']
})
export class EntregasTareasComponent implements OnInit {
  // Datos de usuario
  userEmail: string = '';
  userRole: string = '';
  profesorId: string = '';
  
  // Datos de entregas
  entregas: TareaCalificacionExtendida[] = [];
  entregasFiltradas: TareaCalificacionExtendida[] = [];
  
  // Datos para filtros
  asignaturas: any[] = [];
  tareas: Tarea[] = [];
  alumnos: Usuario[] = [];
  
  // Estados
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  
  // Filtros
  filtroAsignatura: number | null = null;
  filtroTarea: number | null = null;
  filtroAlumno: number | null = null;
  filtroEstado: string = 'todas'; // 'todas', 'entregadas', 'corregidas', 'pendientes'
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  
  constructor(
    private authService: AuthService,
    private entregaService: EntregaService,
    private tareaService: TareaService,
    private usuarioService: UsuarioService,
    private asignaturaService: AsignaturaService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Obtener información del usuario desde el servicio de autenticación
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    this.profesorId = this.authService.getUserId();
    
    // Verificar si el usuario está autenticado y es profesor
    if (!this.authService.isAuthenticated() || this.userRole !== 'profesor') {
      // Redirigir si no es profesor
      return;
    }
    
    // No necesitamos convertir profesorId a número ya que lo mantendremos como string
    
    // Cargar datos iniciales
    this.cargarAsignaturas();
    this.cargarEntregas();
  }
  
  /**
   * Carga las asignaturas del profesor
   */
  cargarAsignaturas(): void {
    this.loading = true;
    
    // Obtener asignaturas del profesor con paginación
    this.asignaturaService.obtenerAsignaturasPorProfesor(parseInt(this.profesorId, 10), 1, 10)
      .subscribe(
        (respuesta: any) => {
          // Verificar si la respuesta tiene el formato esperado
          if (respuesta && respuesta.data) {
            this.asignaturas = respuesta.data;
          } else {
            this.asignaturas = respuesta;
          }
          this.loading = false;
        },
        (err) => {
          console.error('Error al cargar asignaturas:', err);
          this.error = 'Error al cargar las asignaturas. Por favor, intente de nuevo.';
          this.loading = false;
        }
      );
  }
  
  /**
   * Carga las tareas de una asignatura específica
   */
  cargarTareasPorAsignatura(): void {
    if (!this.filtroAsignatura) {
      this.tareas = [];
      return;
    }
    
    this.loading = true;
    
    // Construir parámetros para filtrar por asignatura
    let params = new HttpParams().set('asignaturaId', this.filtroAsignatura.toString());
    
    this.tareaService.obtenerTodasLasTareas(params)
      .subscribe({
        next: (respuesta) => {
          if (respuesta && respuesta.data) {
            this.tareas = respuesta.data;
          } else {
            this.tareas = [];
            this.error = 'Formato de respuesta inesperado al cargar tareas.';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar tareas:', err);
          this.error = 'Error al cargar las tareas. Por favor, intente de nuevo.';
          this.tareas = [];
          this.loading = false;
        }
      });
  }
  
  /**
   * Carga los alumnos matriculados en la asignatura seleccionada
   */
  cargarAlumnosPorAsignatura(): void {
    if (!this.filtroAsignatura) {
      this.alumnos = [];
      return;
    }
    
    this.loading = true;
    
    // Construir parámetros para filtrar por asignatura
    let params = new HttpParams().set('asignaturaId', this.filtroAsignatura.toString());
    
    this.usuarioService.obtenerAlumnos(params)
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.alumnos = response.data;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar alumnos:', err);
          this.error = 'Error al cargar los alumnos. Por favor, intente de nuevo.';
          this.loading = false;
        }
      });
  }
  
  /**
   * Carga todas las entregas relacionadas con las asignaturas del profesor
   */
  cargarEntregas(): void {
    this.loading = true;
    this.error = '';
    
    // Construir parámetros para la paginación y filtrado por profesor
    let params = new HttpParams()
      .set('page', '1')
      .set('limit', '10'); // Solicitar un límite mayor para tener más datos disponibles para filtrar
    
    // Obtener todas las entregas de las tareas del profesor usando el método directo
    this.entregaService.obtenerEntregasProfesor(parseInt(this.profesorId, 10), params)
      .subscribe({
        next: (respuesta) => {
          if (respuesta && respuesta.data) {
            this.entregas = respuesta.data;
            
            // Actualizar información de paginación si está disponible
            if (respuesta.pagination) {
              this.totalItems = respuesta.pagination.total || this.entregas.length;
              this.totalPages = respuesta.pagination.totalPages || Math.ceil(this.totalItems / this.itemsPerPage);
            } else {
              this.totalItems = this.entregas.length;
              this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
            }
            
            this.aplicarFiltros();
          } else {
            this.error = 'No se recibieron datos de entregas del servidor.';
            this.entregas = [];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar entregas:', err);
          this.error = 'Error al cargar las entregas. Por favor, intente de nuevo.';
          this.entregas = [];
          this.loading = false;
        }
      });
  }
  
  /**
   * Aplica los filtros seleccionados a la lista de entregas
   */
  aplicarFiltros(): void {
    this.currentPage = 1;
    
    // Filtrar las entregas según los criterios seleccionados
    let entregasFiltradas = [...this.entregas];
    
    // Filtrar por asignatura
    if (this.filtroAsignatura) {
      entregasFiltradas = entregasFiltradas.filter(
        entrega => entrega.asignatura_id === this.filtroAsignatura
      );
    }
    
    // Filtrar por tarea
    if (this.filtroTarea) {
      entregasFiltradas = entregasFiltradas.filter(
        entrega => entrega.tarea_id === this.filtroTarea
      );
    }
    
    // Filtrar por alumno
    if (this.filtroAlumno) {
      entregasFiltradas = entregasFiltradas.filter(
        entrega => entrega.usuario_id === this.filtroAlumno
      );
    }
    
    // Filtrar por estado
    switch (this.filtroEstado) {
      case 'entregadas':
        // Todas las entregas ya están entregadas, no es necesario filtrar
        break;
      case 'corregidas':
        entregasFiltradas = entregasFiltradas.filter(
          entrega => entrega.calificacion !== null
        );
        break;
      case 'pendientes':
        entregasFiltradas = entregasFiltradas.filter(
          entrega => entrega.calificacion === null
        );
        break;
      default:
        // 'todas' - no aplicar filtro
        break;
    }
    
    // Actualizar la lista filtrada
    this.entregasFiltradas = entregasFiltradas;
    
    // Actualizar paginación
    this.totalItems = this.entregasFiltradas.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  }
  
  /**
   * Cambia la página actual de la paginación
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
    }
  }
  
  /**
   * Maneja el cambio de asignatura seleccionada
   */
  onAsignaturaChange(): void {
    this.filtroTarea = null;
    this.cargarTareasPorAsignatura();
    this.cargarAlumnosPorAsignatura();
    this.aplicarFiltros();
  }
  
  /**
   * Navega a la página de calificación de una entrega
   */
  calificarEntrega(entrega: TareaCalificacionExtendida): void {
    if (!entrega || !entrega.id) {
      this.error = 'No se puede calificar esta entrega porque no tiene un ID válido.';
      return;
    }
    
    // Navegar a la página de calificación con el ID de la entrega
    this.router.navigate(['/dashboard/profesor/calificar-entrega', entrega.id]);
  }
  
  /**
   * Obtiene las entregas paginadas para mostrar en la tabla
   */
  get entregasPaginadas(): TareaCalificacionExtendida[] {
    const inicio = (this.currentPage - 1) * this.itemsPerPage;
    const fin = inicio + this.itemsPerPage;
    return this.entregasFiltradas.slice(inicio, fin);
  }
  
  /**
   * Resetea todos los filtros
   */
  resetearFiltros(): void {
    this.filtroAsignatura = null;
    this.filtroTarea = null;
    this.filtroAlumno = null;
    this.filtroEstado = 'todas';
    this.tareas = [];
    this.alumnos = [];
    this.aplicarFiltros();
  }
}
