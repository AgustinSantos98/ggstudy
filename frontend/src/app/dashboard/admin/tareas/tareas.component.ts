import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/header/header.component';

// Importar los modelos centralizados
import { Tarea, TareaExtendida } from '../../../core/models/tarea.model';
import { Asignatura } from '../../../core/models/asignatura.model';
import { Tema } from '../../../core/models/tema.model';
import { TareaCalificacion, TareaCalificacionExtendida } from '../../../core/models/tarea-calificacion.model';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.css', '../../../shared/admin-common.css']
})
export class TareasComponent implements OnInit {
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;
  
  tareas: TareaExtendida[] = [];
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10; 
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Filtros
  filterTitulo: string = '';
  filterTemaId: string = '';
  filterVisible: string = '';
  
  // Para el formulario de nueva tarea
  showNewForm: boolean = false;
  newTarea: TareaExtendida = this.getEmptyTarea();
  isEditMode: boolean = false;
  tareaId: number | null = null;
  
  // Para los desplegables del formulario
  temas: any[] = [];
  asignaturas: Asignatura[] = [];
  temasFiltrados: any[] = [];
  asignaturaSeleccionada: number = 0;
  
  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Obtener información del usuario desde el servicio de autenticación
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    
    // Verificar si el usuario está autenticado y es administrador o profesor
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Comprobar si el usuario es administrador o profesor
    if (this.userRole !== 'admin' && this.userRole !== 'profesor') {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Verificar si estamos en modo edición (comprobando parámetros de URL)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.tareaId = +params['id'];
        this.isEditMode = true;
        this.loadTareaPorId(this.tareaId);
        this.showNewForm = true;
      }
    });
    
    // Cargar las asignaturas para los desplegables
    this.loadAsignaturas();
    
    // Cargar todos los temas (para compatibilidad con filtros existentes)
    this.loadTemas();
    
    // Cargar las tareas
    this.loadTareas();
  }

  loadTareas(): void {
    this.loading = true;
    this.error = '';
    
    // Construir los parámetros de consulta
    let params = new URLSearchParams();
    params.append('page', this.currentPage.toString());
    params.append('limit', this.itemsPerPage.toString());
    
    // Si el usuario es profesor, filtrar solo las tareas de sus asignaturas
    if (this.userRole === 'profesor') {
      const userId = this.authService.getUserId();
      if (userId) {
        params.append('profesorId', userId);
      }
    }
    
    // Añadir filtros solo si tienen valor
    if (this.filterTitulo && this.filterTitulo.trim()) {
      params.append('titulo', this.filterTitulo.trim());
    }
    if (this.filterTemaId) {
      params.append('temaId', this.filterTemaId);
    }
    if (this.filterVisible) {
      params.append('visibles', this.filterVisible);
    }
    
    // Realizar la petición HTTP
    this.http.get<any>(`http://localhost:3000/api/tareas?${params.toString()}`)
      .subscribe({
        next: (response) => {
          // Comprobar si la respuesta tiene una propiedad data (respuesta paginada)
          if (response && response.data) {
            this.tareas = response.data;
            
            // Manejar la paginación
            if (response.pagination) {
              // Usar los valores del servidor correctamente según la estructura de respuesta
              if (response.pagination.total !== undefined) {
                this.totalItems = response.pagination.total;
              }
              
              if (response.pagination.totalPages !== undefined) {
                this.totalPages = response.pagination.totalPages;
              } else if (response.pagination.total !== undefined) {
                // Calcular páginas si tenemos el total pero no totalPages
                this.totalPages = Math.ceil(response.pagination.total / this.itemsPerPage);
              }
              
              // Actualizar la página actual desde la respuesta
              if (response.pagination.page !== undefined) {
                this.currentPage = response.pagination.page;
              }
            } else {
              // Si no hay información de paginación, usar valores por defecto para pruebas
              this.totalItems = this.tareas.length > 0 ? 25 : 0;
              this.totalPages = this.totalItems > 0 ? 3 : 0;
            }
          } else if (Array.isArray(response)) {
            // Manejar el caso donde la respuesta es un array directo
            this.tareas = response;
            this.totalItems = response.length;
            this.totalPages = 1;
          } else {
            // Formato de respuesta inesperado
            console.error('Formato de respuesta inesperado:', response);
            this.error = 'Error en el formato de datos recibidos.';
            this.tareas = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar las tareas:', err);
          if (err.error && err.error.message) {
            this.error = `Error: ${err.error.message}`;
          } else {
            this.error = 'Error al cargar las tareas. Por favor, intente de nuevo.';
          }
          this.tareas = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.loading = false;
        }
      });
  }

  loadAsignaturas(): void {
    // Construir la URL base
    let url = 'http://localhost:3000/api/asignaturas';
    
    // Si el usuario es profesor, filtrar solo sus asignaturas asignadas
    if (this.userRole === 'profesor') {
      const userId = this.authService.getUserId();
      if (userId) {
        url += `?profesorId=${userId}`;
      }
    }
    
    this.http.get<any>(url)
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.asignaturas = response.data;
          } else if (Array.isArray(response)) {
            this.asignaturas = response;
          } else {
            console.error('Formato de respuesta inesperado para asignaturas:', response);
            this.asignaturas = [];
          }
        },
        error: (err) => {
          console.error('Error al cargar las asignaturas:', err);
          this.asignaturas = [];
        }
      });
  }

  loadTemas(): void {
    this.http.get<any>('http://localhost:3000/api/temas')
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.temas = response.data;
            this.temasFiltrados = [...this.temas];
          } else if (Array.isArray(response)) {
            this.temas = response;
            this.temasFiltrados = [...this.temas];
          } else {
            console.error('Formato de respuesta inesperado para temas:', response);
            this.temas = [];
            this.temasFiltrados = [];
          }
        },
        error: (err) => {
          console.error('Error al cargar los temas:', err);
          this.temas = [];
          this.temasFiltrados = [];
        }
      });
  }
  
  loadTemasPorAsignatura(asignaturaId: number): void {
    if (!asignaturaId) {
      this.temasFiltrados = [...this.temas];
      return;
    }
    
    console.log(`Cargando temas para la asignatura ID: ${asignaturaId}`);
    
    this.http.get<any>(`http://localhost:3000/api/asignaturas/${asignaturaId}/temas`)
      .subscribe({
        next: (response) => {
          console.log('Respuesta de temas por asignatura:', response);
          
          if (response && response.data) {
            console.log('Datos de temas recibidos:', response.data);
            this.temasFiltrados = response.data;
          } else if (Array.isArray(response)) {
            console.log('Array de temas recibido:', response);
            this.temasFiltrados = response;
          } else {
            console.error('Formato de respuesta inesperado para temas por asignatura:', response);
            this.temasFiltrados = [];
          }
          
          console.log('temasFiltrados después de procesar:', this.temasFiltrados);
          
          // Si estamos en modo edición y hay un tema seleccionado, verificar si sigue en la lista
          if (this.isEditMode && this.newTarea.tema_id) {
            const temaExiste = this.temasFiltrados.some(tema => tema.id === this.newTarea.tema_id);
            if (!temaExiste && this.temasFiltrados.length > 0) {
              this.newTarea.tema_id = this.temasFiltrados[0].id;
            }
          }
        },
        error: (err) => {
          console.error('Error al cargar los temas por asignatura:', err);
          this.temasFiltrados = [];
        }
      });
  }
  
  onAsignaturaChange(asignaturaId: number): void {
    this.asignaturaSeleccionada = asignaturaId;
    this.loadTemasPorAsignatura(asignaturaId);
  }

  applyFilters(): void {
    // Restablecer a la primera página al aplicar filtros
    this.currentPage = 1; 
    this.error = '';
    this.successMessage = '';
    this.loadTareas();
  }

  resetFilters(): void {
    // Limpiar todos los filtros
    this.filterTitulo = '';
    this.filterTemaId = '';
    this.filterVisible = '';
    this.currentPage = 1;
    this.error = '';
    this.successMessage = '';
    this.loadTareas();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`Cambiando de página ${this.currentPage} a ${page}`);
      
      // Cambiar a la página solicitada si es válida
      this.currentPage = page;
      
      // Desplazar al inicio de la tabla al cambiar de página
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        const rect = tableContainer.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({ top: rect.top + scrollTop, behavior: 'smooth' });
      }
      
      // Cargar los datos de la nueva página
      this.loadTareas();
    }
  }
  
  /**
   * Genera un array con los números de página para la paginación
   * @returns Array con los números de página disponibles
   */
  getPageArray(): number[] {
    const pages: number[] = [];
    
    // Si hay menos de 7 páginas, mostrar todas
    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1);
      
      // Determinar el rango de páginas a mostrar alrededor de la página actual
      let startPage = Math.max(2, this.currentPage - 2);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
      
      // Ajustar para mostrar 5 páginas en total
      if (startPage > 2) {
        pages.push(-1); // Indicador de "..."
      }
      
      // Añadir páginas intermedias
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Añadir indicador de "..." si es necesario
      if (endPage < this.totalPages - 1) {
        pages.push(-2); // Indicador de "..."
      }
      
      // Siempre mostrar la última página
      pages.push(this.totalPages);
    }
    
    return pages;
  }
  
  /**
   * Ir a la primera página
   */
  goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.onPageChange(1);
    }
  }
  
  /**
   * Ir a la última página
   */
  goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.onPageChange(this.totalPages);
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout();
  }
  
  toggleNewForm(): void {
    this.showNewForm = !this.showNewForm;
    if (this.showNewForm && !this.isEditMode) {
      // Solo reiniciar el formulario si no estamos en modo edición
      this.newTarea = this.getEmptyTarea();
      this.isEditMode = false;
      this.tareaId = null;
    } else if (!this.showNewForm) {
      // Al cerrar el formulario, resetear el modo edición
      this.isEditMode = false;
      this.tareaId = null;
    }
  }
  
  /**
   * Convierte cualquier valor a un booleano verdadero
   * @param value Valor a convertir
   * @returns true si el valor es true, 'true', 1, '1', o cualquier otro valor considerado verdadero
   */
  convertirABooleano(value: any): boolean {
    if (value === undefined || value === null) {
      return false;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'number') {
      return value === 1;
    }
    
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    
    return Boolean(value);
  }
  
  getEmptyTarea(): TareaExtendida {
    // Obtener el ID del usuario y convertirlo a número
    const userId = this.authService.getUserId();
    const userIdNumber = userId ? Number(userId) : 0;
    
    return {
      id: 0,
      tema_id: 0,
      titulo: '',
      descripcion: '',
      fecha_entrega: new Date().toISOString().split('T')[0],
      visible: true,
      creado_por: userIdNumber
    };
  }
  
  saveNewTarea(): void {
    if (!this.validateTarea(this.newTarea)) {
      return;
    }
    
    this.error = ''; 
    this.successMessage = '';
    this.loading = true;
    
    if (this.isEditMode && this.tareaId) {
      // Actualizar tarea existente
      console.log('Enviando datos para actualizar:', this.newTarea);
      
      // Preparar los datos para enviar al servidor
      const tareaData = {
        tema_id: this.newTarea.tema_id,
        titulo: this.newTarea.titulo,
        descripcion: this.newTarea.descripcion,
        fecha_entrega: this.newTarea.fecha_entrega,
        visible: this.newTarea.visible,
        archivo: this.newTarea.archivo,
        creado_por: this.newTarea.creado_por || (this.authService.getUserId() ? Number(this.authService.getUserId()) : 0)
      };
      
      // Asegurarse de que la tarea tenga todos los campos requeridos
      const tareaActualizada: Tarea = {
        id: this.tareaId || 0,
        tema_id: tareaData.tema_id,
        titulo: tareaData.titulo,
        descripcion: tareaData.descripcion,
        fecha_entrega: tareaData.fecha_entrega,
        visible: tareaData.visible,
        archivo: tareaData.archivo,
        creado_por: tareaData.creado_por
      };
      
      this.http.put<any>(`http://localhost:3000/api/tareas/${this.tareaId}`, tareaActualizada).subscribe({
        next: (response) => {
          console.log('Actualización exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Tarea ${this.newTarea.titulo} actualizada correctamente.`;
          
          // Cargar las tareas de nuevo para mostrar los cambios
          this.loadTareas();
          
          // Resetear el modo edición
          this.isEditMode = false;
          this.tareaId = null;
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al actualizar la tarea:', err);
          this.handleError(err, 'actualizar');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Crear nueva tarea
      const tareaData = {
        tema_id: this.newTarea.tema_id,
        titulo: this.newTarea.titulo,
        descripcion: this.newTarea.descripcion,
        fecha_entrega: this.newTarea.fecha_entrega,
        visible: this.newTarea.visible,
        archivo: this.newTarea.archivo,
        creado_por: this.authService.getUserId() ? Number(this.authService.getUserId()) : 0 // Obtener el ID del usuario actual
      };
      
      // Asegurarse de que la tarea tenga todos los campos requeridos
      const tareaNueva: Tarea = {
        id: 0, // El ID será asignado por el servidor
        tema_id: tareaData.tema_id,
        titulo: tareaData.titulo,
        descripcion: tareaData.descripcion,
        fecha_entrega: tareaData.fecha_entrega,
        visible: tareaData.visible,
        archivo: tareaData.archivo,
        creado_por: tareaData.creado_por
      };
      
      this.http.post<any>('http://localhost:3000/api/tareas', tareaNueva).subscribe({
        next: (response) => {
          console.log('Creación exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Tarea ${this.newTarea.titulo} creada correctamente.`;
          
          // Asegurarse de que estamos en la primera página para ver la nueva tarea
          this.currentPage = 1;
          
          // Cargar las tareas de nuevo para mostrar la recién creada
          this.loadTareas();
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al crear la tarea:', err);
          this.handleError(err, 'crear');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
  
  validateTarea(tarea: TareaExtendida): boolean {
    if (!tarea.tema_id) {
      this.error = 'El tema es obligatorio';
      return false;
    }
    
    if (!tarea.titulo.trim()) {
      this.error = 'El título es obligatorio';
      return false;
    }
    
    if (!tarea.fecha_entrega) {
      this.error = 'La fecha de entrega es obligatoria';
      return false;
    }
    
    return true;
  }

  // Navegación para editar tarea
  navigateToEditTarea(tareaId: number): void {
    // En lugar de navegar a otra ruta, cargar la tarea y mostrar el formulario
    this.loadTareaPorId(tareaId);
  }
  
  // Cargar datos de una tarea por su ID
  loadTareaPorId(tareaId: number): void {
    this.loading = true;
    this.error = '';
    
    this.http.get<any>(`http://localhost:3000/api/tareas/${tareaId}`).subscribe({
      next: (response) => {        
        // Comprobar si la respuesta es directamente el objeto de tarea
        if (response && response.id) {
          this.newTarea = {
            id: response.id,
            tema_id: response.tema_id,
            titulo: response.titulo,
            descripcion: response.descripcion,
            fecha_entrega: response.fecha_entrega ? new Date(response.fecha_entrega).toISOString().split('T')[0] : '',
            visible: this.convertirABooleano(response.visible),
            archivo: response.archivo,
            creado_por: response.creado_por || this.authService.getUserId() || 0
          };
          
          // Establecer la asignatura seleccionada
          this.asignaturaSeleccionada = response.asignatura_id;
          
          this.isEditMode = true;
          this.tareaId = tareaId;
          this.showNewForm = true;
        } 
        // Comprobar si la respuesta tiene un formato con propiedad data o tarea
        else if (response && response.data) {
            const tarea = response.data;
            this.newTarea = {
              id: tarea.id,
              tema_id: tarea.tema_id,
              titulo: tarea.titulo,
              descripcion: tarea.descripcion,
              fecha_entrega: tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toISOString().split('T')[0] : '',
              visible: tarea.visible !== undefined ? tarea.visible : true,
              archivo: tarea.archivo,
              creado_por: tarea.creado_por || (this.authService.getUserId() ? Number(this.authService.getUserId()) : 0)
            };
          
          console.log('Valor original de visible (formato data/tarea):', tarea.visible);
          console.log('Valor convertido de visible (formato data/tarea):', this.newTarea.visible);
          this.isEditMode = true;
          this.tareaId = tareaId;
          this.showNewForm = true;
        } else {
          this.error = 'No se pudo cargar la información de la tarea.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la tarea:', err);
        this.error = 'Error al cargar los datos de la tarea. Por favor, intente de nuevo.';
        this.loading = false;
      }
    });
  }
  
  // Cambiar visibilidad de la tarea (visible/no visible)
  cambiarVisibilidadTarea(tarea: TareaExtendida): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    const nuevoEstado = !tarea.visible;
    
    this.http.patch<any>(`http://localhost:3000/api/tareas/${tarea.id}/visibilidad`, { visible: nuevoEstado }).subscribe({
      next: (response) => {
        tarea.visible = nuevoEstado;
        this.successMessage = `Tarea ${tarea.titulo} ${nuevoEstado ? 'visible' : 'oculta'} correctamente.`;
        
        // Limpiar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cambiar la visibilidad de la tarea:', err);
        this.handleError(err, 'cambiar la visibilidad de');
        this.loading = false;
      }
    });
  }
  
  // Eliminar tarea
  eliminarTarea(tarea: TareaExtendida): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar la tarea "${tarea.titulo}"?`)) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    this.http.delete<any>(`http://localhost:3000/api/tareas/${tarea.id}`).subscribe({
      next: (response) => {
        console.log('Eliminación exitosa:', response);
        this.successMessage = `Tarea ${tarea.titulo} eliminada correctamente.`;
        
        // Cargar las tareas de nuevo para actualizar la lista
        this.loadTareas();
        
        // Limpiar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error al eliminar la tarea:', err);
        this.handleError(err, 'eliminar');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  // Manejar errores comunes
  handleError(err: any, accion: string): void {
    if (err.error && err.error.message) {
      // Error con mensaje específico del servidor
      this.error = `${err.error.message}`;
    } else if (err.status === 409) {
      // Error de conflicto
      this.error = `Ya existe una tarea con ese título.`;
    } else if (err.status === 400) {
      // Error de validación
      this.error = `Datos inválidos. Por favor, revise la información proporcionada.`;
    } else {
      // Error genérico
      this.error = `Error al ${accion} la tarea. Por favor, intente de nuevo.`;
    }
  }
  
  // Obtener el nombre del tema
  getTemaNombre(tarea: TareaExtendida): string {
    if (tarea.tema_nombre) {
      return tarea.tema_nombre;
    } else if (tarea.tema_id) {
      const tema = this.temas.find(t => t.id === tarea.tema_id);
      if (tema) {
        return tema.tema_nombre || tema.nombre;
      }
    }
    return 'Desconocido';
  }
  
  // Obtener el nombre de la asignatura
  getAsignaturaNombre(tarea: TareaExtendida): string {
    if (tarea.asignatura_nombre) {
      return tarea.asignatura_nombre;
    }
    return 'Desconocida';
  }
  
  // Obtener el nombre del curso
  getCursoNombre(tarea: TareaExtendida): string {
    if (tarea.curso_nombre) {
      return tarea.curso_nombre;
    }
    return 'Desconocido';
  }
  
  // Formatear fecha para mostrar
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Sin fecha';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Obtener el nombre del creador
  getCreadorNombre(tarea: TareaExtendida): string {
    if (tarea.creador_nombre && tarea.creador_apellido) {
      return `${tarea.creador_nombre} ${tarea.creador_apellido}`;
    }
    return 'Desconocido';
  }
}
