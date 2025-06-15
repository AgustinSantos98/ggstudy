import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { Tema } from '../../../core/models/tema.model';

@Component({
  selector: 'app-temas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './temas.component.html',
  styleUrls: ['./temas.component.css', '../../../shared/admin-common.css']
})
export class TemasComponent implements OnInit {
  // Lista de colores para asignar aleatoriamente a los temas
  private static readonly temaColors: string[] = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;
  
  temas: Tema[] = [];
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10; 
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Filtros
  filterNombre: string = '';
  filterAsignaturaId: string = '';
  
  // Para el formulario de nuevo tema
  showNewForm: boolean = false;
  newTema: Tema = this.getEmptyTema();
  isEditMode: boolean = false;
  temaId: number | null = null;
  
  // Para los desplegables del formulario
  asignaturas: any[] = [];
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Obtener información del usuario desde el servicio de autenticación
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    
    // Verificar si el usuario está autenticado
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
        this.temaId = +params['id'];
        this.isEditMode = true;
        this.loadTemaPorId(this.temaId);
        this.showNewForm = true;
      }
    });
    
    // Cargar las asignaturas para los desplegables
    this.loadAsignaturas();
    
    // Cargar los temas
    this.loadTemas();
  }

  loadTemas(): void {
    this.loading = true;
    this.error = '';
    
    // Construir los parámetros de consulta
    let params = new URLSearchParams();
    params.append('page', this.currentPage.toString());
    params.append('limit', this.itemsPerPage.toString());
    
    // Si el usuario es profesor, filtrar solo los temas de sus asignaturas
    if (this.userRole === 'profesor') {
      const userId = this.authService.getUserId();
      if (userId) {
        params.append('profesorId', userId);
      }
    }
    
    // Añadir filtros solo si tienen valor
    if (this.filterNombre && this.filterNombre.trim()) {
      params.append('nombre', this.filterNombre.trim());
    }
    if (this.filterAsignaturaId) {
      params.append('asignaturaId', this.filterAsignaturaId);
    }
    
    // Realizar la petición HTTP
    this.http.get<any>(`http://localhost:3000/api/temas?${params.toString()}`)
      .subscribe({
        next: (response) => {
          // Comprobar si la respuesta tiene una propiedad data (respuesta paginada)
          if (response && response.data) {
            this.temas = response.data;
            
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
              this.totalItems = this.temas.length > 0 ? 25 : 0;
              this.totalPages = this.totalItems > 0 ? 3 : 0;
            }
          } else if (Array.isArray(response)) {
            this.temas = response;
            this.totalItems = response.length;
            this.totalPages = 1;
          } else {
            // Formato de respuesta inesperado
            console.error('Formato de respuesta inesperado:', response);
            this.error = 'Error en el formato de datos recibidos.';
            this.temas = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
          
          // Normalizar los datos y inicializar contadores
          this.temas.forEach(tema => {
            // Asegurar que nombre esté disponible (puede venir como tema_nombre del backend)
            if (!tema.nombre && tema.tema_nombre) {
              tema.nombre = tema.tema_nombre;
            }
            
            // Inicializar contador de tareas a 0 si no existe
            if (tema.tareasCount === undefined) {
              tema.tareasCount = 0;
            }
          });
          
          this.loading = false;
          
          // Después de cargar los temas, obtener el número de tareas para cada uno
          this.loadTareasCounts();
        },
        error: (err) => {
          console.error('Error al cargar los temas:', err);
          if (err.error && err.error.message) {
            this.error = `Error: ${err.error.message}`;
          } else {
            this.error = 'Error al cargar los temas. Por favor, intente de nuevo.';
          }
          this.temas = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.loading = false;
        }
      });
  }
  
  loadTareasCounts(): void {
    // Para cada tema, obtener el número de tareas
    this.temas.forEach(tema => {
      this.http.get<any>(`http://localhost:3000/api/temas/${tema.id}/tareas`)
        .subscribe({
          next: (response) => {
            // Verificar si la respuesta tiene el formato esperado con data y pagination
            if (response && response.data) {
              // Actualizar el contador de tareas del tema usando la matriz de datos
              tema.tareasCount = response.data.length;
              
              // Alternativa: usar el total de la paginación si está disponible
              if (response.pagination && response.pagination.total !== undefined) {
                tema.tareasCount = response.pagination.total;
              }
            } else if (Array.isArray(response)) {
              // Si la respuesta es directamente un array (por compatibilidad)
              tema.tareasCount = response.length;
            } else {
              console.warn(`Formato de respuesta inesperado para tareas del tema ${tema.id}`);
              tema.tareasCount = 0;
            }
          },
          error: (err) => {
            console.error(`Error al obtener tareas para el tema ${tema.id}:`, err);
            tema.tareasCount = 0;
          }
        });
    });
  }

  loadAsignaturas(): void {
    // Construir los parámetros de consulta según el rol del usuario
    let params = new URLSearchParams();
    
    // Si el usuario es profesor, filtrar solo sus asignaturas asignadas
    if (this.userRole === 'profesor') {
      const userId = this.authService.getUserId();
      if (userId) {
        params.append('profesorId', userId);
      }
    }
    
    this.http.get<any>(`http://localhost:3000/api/asignaturas?${params.toString()}`)
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

  applyFilters(): void {
    // Restablecer a la primera página al aplicar filtros
    this.currentPage = 1; 
    this.error = '';
    this.successMessage = '';
    this.loadTemas();
  }

  resetFilters(): void {
    // Limpiar todos los filtros
    this.filterNombre = '';
    this.filterAsignaturaId = '';
    this.currentPage = 1;
    this.error = '';
    this.successMessage = '';
    this.loadTemas();
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
      this.loadTemas();
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
      this.newTema = this.getEmptyTema();
      this.isEditMode = false;
      this.temaId = null;
    } else if (!this.showNewForm) {
      // Al cerrar el formulario, resetear el modo edición
      this.isEditMode = false;
      this.temaId = null;
    }
  }
  
  getEmptyTema(): Tema {
    return {
      id: 0,
      asignatura_id: 0,
      nombre: ''
    };
  }
  
  saveNewTema(): void {
    if (!this.validateTema(this.newTema)) {
      return;
    }
    
    this.error = ''; 
    this.successMessage = '';
    this.loading = true;
    
    if (this.isEditMode && this.temaId) {
      // Actualizar tema existente
      console.log('Enviando datos para actualizar:', this.newTema);
      
      // Preparar los datos para enviar al servidor
      const temaData = {
        asignatura_id: this.newTema.asignatura_id,
        nombre: this.newTema.nombre
      };
      
      this.http.put<any>(`http://localhost:3000/api/temas/${this.temaId}`, temaData).subscribe({
        next: (response) => {
          console.log('Actualización exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Tema ${this.newTema.nombre} actualizado correctamente.`;
          
          // Cargar los temas de nuevo para mostrar los cambios
          this.loadTemas();
          
          // Reiniciar el modo edición
          this.isEditMode = false;
          this.temaId = null;
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al actualizar el tema:', err);
          this.handleError(err, 'actualizar');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo tema
      const temaData = {
        asignatura_id: this.newTema.asignatura_id,
        nombre: this.newTema.nombre
      };
      
      this.http.post<any>('http://localhost:3000/api/temas', temaData).subscribe({
        next: (response) => {
          console.log('Creación exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Tema ${this.newTema.nombre} creado correctamente.`;
          
          // Asegurarse de que estamos en la primera página para ver el nuevo tema
          this.currentPage = 1;
          
          // Cargar los temas de nuevo para mostrar el recién creado
          this.loadTemas();
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al crear el tema:', err);
          this.handleError(err, 'crear');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
  
  validateTema(tema: Tema): boolean {
    if (!tema.asignatura_id) {
      this.error = 'La asignatura es obligatoria';
      return false;
    }
    
    if (!tema.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }
    
    return true;
  }

  // Navegación para editar tema
  navigateToEditTema(temaId: number): void {
    // En lugar de navegar a otra ruta, cargar el tema y mostrar el formulario
    this.loadTemaPorId(temaId);
  }
  
  // Cargar datos de un tema por su ID
  loadTemaPorId(temaId: number): void {
    this.loading = true;
    this.error = '';
    
    this.http.get<any>(`http://localhost:3000/api/temas/${temaId}`).subscribe({
      next: (response) => {        
        // Comprobar si la respuesta es directamente el objeto de tema
        if (response && response.id) {
          this.newTema = {
            id: response.id,
            asignatura_id: response.asignatura_id,
            nombre: response.nombre
          };
          this.isEditMode = true;
          this.temaId = temaId;
          this.showNewForm = true;
        } 
        // Comprobar si la respuesta tiene un formato con propiedad data
        else if (response && response.data) {
          this.newTema = {
            id: response.data.id,
            asignatura_id: response.data.asignatura_id,
            nombre: response.data.nombre
          };
          this.isEditMode = true;
          this.temaId = temaId;
          this.showNewForm = true;
        } else {
          this.error = 'No se pudo cargar la información del tema.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el tema:', err);
        this.error = 'Error al cargar los datos del tema. Por favor, intente de nuevo.';
        this.loading = false;
      }
    });
  }
  
  // Eliminar tema
  eliminarTema(tema: Tema): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar el tema "${tema.nombre}"?`)) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    this.http.delete<any>(`http://localhost:3000/api/temas/${tema.id}`).subscribe({
      next: (response) => {
        console.log('Eliminación exitosa:', response);
        this.successMessage = `Tema ${tema.nombre} eliminado correctamente.`;
        
        // Cargar los temas de nuevo para actualizar la lista
        this.loadTemas();
        
        // Limpiar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error al eliminar el tema:', err);
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
      this.error = `Ya existe un tema con ese nombre.`;
    } else if (err.status === 400) {
      // Error de validación
      this.error = `Datos inválidos. Por favor, revise la información proporcionada.`;
    } else {
      // Error genérico
      this.error = `Error al ${accion} el tema. Por favor, intente de nuevo.`;
    }
  }
  
  // Obtener el nombre de la asignatura
  getAsignaturaNombre(tema: Tema): string {
    if (tema.asignatura_nombre) {
      return tema.asignatura_nombre;
    } else if (tema.asignatura_id) {
      const asignatura = this.asignaturas.find(a => a.id === tema.asignatura_id);
      if (asignatura) {
        return asignatura.nombre;
      }
    }
    return 'Desconocida';
  }
  
  // Obtener el nombre del curso
  getCursoNombre(tema: Tema): string {
    if (tema.curso_nombre) {
      return tema.curso_nombre;
    }
    return 'Desconocido';
  }
}
