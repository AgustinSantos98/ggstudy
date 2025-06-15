import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { Asignatura } from '../../../core/models/asignatura.model';
import { AsignaturaService, RespuestaPaginada } from '../../../core/services/asignatura.service';
import { CursoService } from '../../../core/services/curso.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Curso } from '../../../core/models/curso.model';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-asignaturas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './asignaturas.component.html',
  styleUrls: ['./asignaturas.component.css', '../../../shared/admin-common.css']
})
export class AsignaturasComponent implements OnInit {
  // Lista de colores para asignar aleatoriamente a las asignaturas
  private static readonly asignaturaColors: string[] = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;
  
  asignaturas: Asignatura[] = [];
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
  filterCursoId: string = '';
  filterProfesorId: string = '';
  
  // Para el formulario de nueva asignatura
  showNewForm: boolean = false;
  newAsignatura: Asignatura = this.getEmptyAsignatura();
  isEditMode: boolean = false;
  asignaturaId: number | null = null;
  
  // Para los desplegables del formulario
  cursos: Curso[] = [];
  profesores: Usuario[] = [];
  
  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private asignaturaService: AsignaturaService,
    private cursoService: CursoService,
    private usuarioService: UsuarioService
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
    
    // Comprobar si el usuario tiene permisos (admin o profesor)
    if (this.userRole !== 'admin' && this.userRole !== 'profesor') {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Verificar si estamos en modo edición (comprobando parámetros de URL)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.asignaturaId = +params['id'];
        this.isEditMode = true;
        this.loadAsignaturaPorId(this.asignaturaId);
        this.showNewForm = true;
      }
    });
    
    // Cargar los cursos y profesores para los desplegables
    this.loadCursos();
    this.loadProfesores();
    
    // Cargar las asignaturas
    this.loadAsignaturas();
  }

  /**
   * Carga la lista de asignaturas con filtros y paginación
   */
  loadAsignaturas(): void {
    this.loading = true;
    this.error = '';
    
    // Construir los parámetros de consulta usando HttpParams
    let httpParams = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());
    
    // Si el usuario es profesor, filtrar solo sus asignaturas asignadas
    if (this.userRole === 'profesor') {
      const userId = this.authService.getUserId();
      if (userId) {
        httpParams = httpParams.set('profesorId', userId);
      }
    }
    
    // Añadir filtros solo si tienen valor
    if (this.filterNombre && this.filterNombre.trim()) {
      httpParams = httpParams.set('nombre', this.filterNombre.trim());
    }
    if (this.filterCursoId) {
      httpParams = httpParams.set('cursoId', this.filterCursoId);
    }
    if (this.filterProfesorId && this.userRole === 'admin') { // Solo permitir filtrar por profesor si es admin
      httpParams = httpParams.set('profesorId', this.filterProfesorId);
    }
    
    // Usar el servicio de asignaturas para obtener los datos
    this.asignaturaService.obtenerTodasLasAsignaturas(httpParams)
      .subscribe({
        next: (response) => {
          // Comprobar si la respuesta tiene una propiedad data (respuesta paginada)
          if (response && response.data) {
            this.asignaturas = response.data;
            
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
              this.totalItems = this.asignaturas.length > 0 ? 25 : 0;
              this.totalPages = this.totalItems > 0 ? 3 : 0;
            }
          } else if (Array.isArray(response)) {
            // Manejar el caso donde la respuesta es un array directo
            this.asignaturas = response;
            this.totalItems = response.length;
            this.totalPages = 1;
          } else {
            // Formato de respuesta inesperado
            console.error('Formato de respuesta inesperado:', response);
            this.error = 'Error en el formato de datos recibidos.';
            this.asignaturas = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
          
          // Solo inicializar contador de temas si no existe
          this.asignaturas.forEach(asignatura => {
            // Inicializar contador de temas a 0 si no existe
            if (asignatura.temasCount === undefined) {
              asignatura.temasCount = 0;
            }
          });
          
          this.loading = false;
          
          // Después de cargar las asignaturas, obtener el número de temas para cada una
          this.loadTemasCounts();
        },
        error: (err) => {
          console.error('Error al cargar las asignaturas:', err);
          if (err.error && err.error.message) {
            this.error = `Error: ${err.error.message}`;
          } else {
            this.error = 'Error al cargar las asignaturas. Por favor, intente de nuevo.';
          }
          this.asignaturas = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.loading = false;
        }
      });
  }
  
  /**
   * Carga el número de temas para cada asignatura
   */
  loadTemasCounts(): void {
    // Para cada asignatura, obtener el número de temas
    this.asignaturas.forEach(asignatura => {
      this.asignaturaService.obtenerTemasDeAsignatura(asignatura.id)
        .subscribe({
          next: (response) => {
            // Verificar si la respuesta tiene el formato esperado con data y pagination
            if (response && response.data) {
              // Actualizar el contador de temas de la asignatura usando la matriz de datos
              asignatura.temasCount = response.data.length;
              
              // Alternativa: usar el total de la paginación si está disponible
              if (response.pagination && response.pagination.total !== undefined) {
                asignatura.temasCount = response.pagination.total;
              }
            } else if (Array.isArray(response)) {
              // Si la respuesta es directamente un array (por compatibilidad)
              asignatura.temasCount = response.length;
            } else {
              console.warn(`Formato de respuesta inesperado para temas de la asignatura ${asignatura.id}`);
              asignatura.temasCount = 0;
            }
          },
          error: (err) => {
            console.error(`Error al obtener temas para la asignatura ${asignatura.id}:`, err);
            asignatura.temasCount = 0;
          }
        });
    });
  }

  /**
   * Carga la lista de cursos para el desplegable del formulario
   */
  loadCursos(): void {
    this.cursoService.obtenerTodosLosCursos()
      .subscribe({
        next: (response: RespuestaPaginada<Curso>) => {
          if (response && response.data) {
            this.cursos = response.data;
          } else {
            console.error('Formato de respuesta inesperado para cursos:', response);
            this.cursos = [];
          }
        },
        error: (err: any) => {
          console.error('Error al cargar los cursos:', err);
          this.cursos = [];
        }
      });
  }

  /**
   * Carga la lista de profesores para el desplegable del formulario
   */
  loadProfesores(): void {
    // Cargar solo usuarios con rol de profesor
    this.usuarioService.obtenerProfesores()
      .subscribe({
        next: (response: RespuestaPaginada<Usuario>) => {
          if (response && response.data) {
            this.profesores = response.data;
          } else {
            console.error('Formato de respuesta inesperado para profesores:', response);
            this.profesores = [];
          }
        },
        error: (err: any) => {
          console.error('Error al cargar los profesores:', err);
          this.profesores = [];
        }
      });
  }

  applyFilters(): void {
    // Restablecer a la primera página al aplicar filtros
    this.currentPage = 1; 
    this.error = '';
    this.successMessage = '';
    this.loadAsignaturas();
  }

  resetFilters(): void {
    // Limpiar todos los filtros
    this.filterNombre = '';
    this.filterCursoId = '';
    this.filterProfesorId = '';
    this.currentPage = 1;
    this.error = '';
    this.successMessage = '';
    this.loadAsignaturas();
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
      this.loadAsignaturas();
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
      this.newAsignatura = this.getEmptyAsignatura();
      this.isEditMode = false;
      this.asignaturaId = null;
    } else if (!this.showNewForm) {
      // Al cerrar el formulario, resetear el modo edición
      this.isEditMode = false;
      this.asignaturaId = null;
    }
  }
  
  getEmptyAsignatura(): Asignatura {
    return {
      id: 0,
      curso_id: 0,
      nombre: '',
      descripcion: '',
      profesor_id: undefined
    };
  }
  
  saveNewAsignatura(): void {
    if (!this.validateAsignatura(this.newAsignatura)) {
      return;
    }
    
    this.error = ''; 
    this.successMessage = '';
    this.loading = true;
    
    if (this.isEditMode && this.asignaturaId) {
      // Actualizar asignatura existente
      console.log('Enviando datos para actualizar:', this.newAsignatura);
      
      this.asignaturaService.actualizarAsignatura(this.asignaturaId, this.newAsignatura).subscribe({
        next: (response) => {
          console.log('Actualización exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Asignatura ${this.newAsignatura.nombre} actualizada correctamente.`;
          
          // Cargar las asignaturas de nuevo para mostrar los cambios
          this.loadAsignaturas();
          
          // Resetear el modo edición
          this.isEditMode = false;
          this.asignaturaId = null;
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al actualizar la asignatura:', err);
          this.handleError(err, 'actualizar');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Crear nueva asignatura
      this.asignaturaService.crearAsignatura(this.newAsignatura).subscribe({
        next: (response) => {
          console.log('Creación exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Asignatura ${this.newAsignatura.nombre} creada correctamente.`;
          
          // Asegurarse de que estamos en la primera página para ver la nueva asignatura
          this.currentPage = 1;
          
          // Cargar las asignaturas de nuevo para mostrar la recién creada
          this.loadAsignaturas();
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al crear la asignatura:', err);
          this.handleError(err, 'crear');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
  
  validateAsignatura(asignatura: Asignatura): boolean {
    if (!asignatura.curso_id) {
      this.error = 'El curso es obligatorio';
      return false;
    }
    
    if (!asignatura.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }
    
    return true;
  }

  // Navegación para editar asignatura
  navigateToEditAsignatura(asignaturaId: number): void {
    // En lugar de navegar a otra ruta, cargar la asignatura y mostrar el formulario
    this.loadAsignaturaPorId(asignaturaId);
  }
  
  /**
   * Cargar datos de una asignatura por su ID utilizando el servicio
   * 
   * @param asignaturaId Identificador de la asignatura a cargar
   */
  loadAsignaturaPorId(asignaturaId: number): void {
    this.loading = true;
    this.error = '';
    
    this.asignaturaService.obtenerAsignaturaPorId(asignaturaId).subscribe({
      next: (response) => {        
        // Extraer los datos de la asignatura de la respuesta, que puede tener diferentes formatos
        let asignaturaData: Asignatura | undefined;
        
        // Comprobar si la respuesta es directamente el objeto de asignatura
        if ('id' in response && response.id) {
          asignaturaData = response as Asignatura;
        } 
        // Comprobar si la respuesta tiene un formato con propiedad data
        else if ('data' in response && response.data) {
          asignaturaData = response.data;
        }
        
        if (asignaturaData) {
          this.newAsignatura = {
            ...asignaturaData
          };
          this.isEditMode = true;
          this.asignaturaId = asignaturaId;
          this.showNewForm = true;
        } else {
          this.error = 'No se pudo cargar la información de la asignatura.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la asignatura:', err);
        this.error = 'Error al cargar los datos de la asignatura. Por favor, intente de nuevo.';
        this.loading = false;
      }
    });
  }
  
  /**
   * Elimina una asignatura del sistema
   * 
   * @param asignatura Asignatura a eliminar
   */
  eliminarAsignatura(asignatura: Asignatura): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar la asignatura "${asignatura.nombre}"?`)) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    this.asignaturaService.eliminarAsignatura(asignatura.id).subscribe({
      next: (response) => {
        console.log('Eliminación exitosa:', response);
        this.successMessage = `Asignatura ${asignatura.nombre} eliminada correctamente.`;
        
        // Cargar las asignaturas de nuevo para actualizar la lista
        this.loadAsignaturas();
        
        // Limpiar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error al eliminar la asignatura:', err);
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
      this.error = `Ya existe una asignatura con ese nombre.`;
    } else if (err.status === 400) {
      // Error de validación
      this.error = `Datos inválidos. Por favor, revise la información proporcionada.`;
    } else {
      // Error genérico
      this.error = `Error al ${accion} la asignatura. Por favor, intente de nuevo.`;
    }
  }
  
  // Obtener el nombre completo del profesor
  getProfesorNombreCompleto(asignatura: Asignatura): string {
    if (asignatura.profesor_nombre && asignatura.profesor_apellido) {
      return `${asignatura.profesor_nombre} ${asignatura.profesor_apellido}`;
    } else if (asignatura.profesor_id) {
      const profesor = this.profesores.find(p => p.id === asignatura.profesor_id);
      if (profesor) {
        return `${profesor.nombre} ${profesor.apellido}`;
      }
    }
    return 'Sin asignar';
  }
  
  // Obtener el nombre del curso
  getCursoNombre(asignatura: Asignatura): string {
    if (asignatura.curso_nombre) {
      return asignatura.curso_nombre;
    } else if (asignatura.curso_id) {
      const curso = this.cursos.find(c => c.id === asignatura.curso_id);
      if (curso) {
        return curso.nombre;
      }
    }
    return 'Desconocido';
  }
}
