import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { Usuario } from '../../../core/models/usuario.model';
import { UsuarioService, RespuestaPaginada } from '../../../core/services/usuario.service';
import { MatriculaService } from '../../../core/services/matricula.service';
import { Curso } from '../../../core/models/curso.model';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './alumnos.component.html',
  styleUrls: ['./alumnos.component.css', '../../../shared/admin-common.css']
})
export class AlumnosComponent implements OnInit {
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;
  profesorId: string = '';
  
  alumnos: Usuario[] = [];
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';

  // Para la gestión de cursos
  cursosMatriculados: Curso[] = [];
  cursosDisponibles: Curso[] = [];
  cursoSeleccionado: number | null = null;
  loadingCursos: boolean = false;

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10; 
  totalItems: number = 0;
  totalPages: number = 0;

  // Filtros
  filterNombre: string = '';
  filterEmail: string = '';
  filterDni: string = '';
  
  // Almacena datos del último acceso por ID de usuario
  private lastAccessMap: Map<number, string> = new Map();
  
  // Para el formulario de alumno (nuevo o edición)
  showNewForm: boolean = false;
  newAlumno: Usuario = this.getEmptyAlumno();
  isEditMode: boolean = false;
  alumnoId: number = 0;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private usuarioService: UsuarioService,
    private matriculaService: MatriculaService
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
        this.alumnoId = +params['id'];
        this.isEditMode = true;
        this.loadAlumnoById(this.alumnoId);
        this.showNewForm = true;
      }
    });
    
    this.loadAlumnos(); 
  }

  /**
   * Carga la lista de alumnos con filtros y paginación
   */
  loadAlumnos(): void {
    this.loading = true;
    this.error = ''; 

    // Construir los parámetros de consulta usando HttpParams
    let httpParams = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());
    
    // Añadir filtros solo si tienen valor
    if (this.filterNombre && this.filterNombre.trim()) {
      httpParams = httpParams.set('nombre', this.filterNombre.trim());
    }
    if (this.filterEmail && this.filterEmail.trim()) {
      httpParams = httpParams.set('email', this.filterEmail.trim());
    }
    if (this.filterDni && this.filterDni.trim()) {
      httpParams = httpParams.set('dni', this.filterDni.trim());
    }
    
    // Si el usuario es profesor, añadir filtro para mostrar solo sus alumnos
    if (this.userRole === 'profesor' && this.profesorId) {
      httpParams = httpParams.set('profesorId', this.profesorId);
    }

    // Usar el servicio de usuarios para obtener los datos
    this.usuarioService.obtenerAlumnos(httpParams)
      .subscribe({
        next: (response: RespuestaPaginada<Usuario>) => {
          
          if (response && response.data) {
            this.alumnos = response.data;
            
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
              this.totalItems = 0;
              this.totalPages = 0;
            }
            
            // Si no hay resultados pero hay filtros aplicados, mostrar mensaje
            if (this.alumnos.length === 0 && (this.filterNombre || this.filterEmail || this.filterDni)) {
              this.error = 'No se encontraron alumnos con los filtros aplicados.';
            }
          } else {
            // Formato de respuesta inesperado
            console.error('Formato de respuesta inesperado:', response);
            this.error = 'Error en el formato de datos recibidos.';
            this.alumnos = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
          
          // Generar texto de último acceso para cada estudiante una vez
          this.alumnos.forEach(alumno => {
            if (!this.lastAccessMap.has(alumno.id)) {
              const days = Math.floor(Math.random() * 5) + 1;
              const hours = Math.floor(Math.random() * 24);
              this.lastAccessMap.set(alumno.id, `${days} día${days !== 1 ? 's' : ''} ${hours} hora${hours !== 1 ? 's' : ''}`);
            }
          });
          
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar los alumnos:', err);
          if (err.error && err.error.message) {
            this.error = `Error: ${err.error.message}`;
          } else {
            this.error = 'Error al cargar los alumnos. Por favor, intente de nuevo.';
          }
          this.alumnos = [];
          
          // Para pruebas: incluso en caso de error, mostrar datos de paginación
          this.totalItems = 25;
          this.totalPages = 3;
          
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    // Restablecer a la primera página al aplicar filtros
    this.currentPage = 1; 
    this.error = '';
    this.successMessage = '';
    this.loadAlumnos();
  }

  resetFilters(): void {
    // Limpiar todos los filtros
    this.filterNombre = '';
    this.filterEmail = '';
    this.filterDni = '';
    this.currentPage = 1;
    this.error = '';
    this.successMessage = '';
    this.loadAlumnos();
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
      this.loadAlumnos();
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
      this.newAlumno = this.getEmptyAlumno();
      this.isEditMode = false;
      this.alumnoId = 0;
    } else if (!this.showNewForm) {
      // Al cerrar el formulario, resetear el modo edición
      this.isEditMode = false;
      this.alumnoId = 0;
    }
  }
  
  getEmptyAlumno(): Usuario {
    return {
      id: 0,
      dni: '',
      nombre: '',
      apellido: '',
      rol: 'alumno',
      email: '',
      fecha_nacimiento: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      telefono: ''
    };
  }
  
  /**
   * Guarda los datos del alumno (creación o actualización)
   */
  saveNewAlumno(): void {
    if (!this.validateAlumno(this.newAlumno)) {
      return;
    }
    
    this.error = ''; 
    this.successMessage = '';
    this.loading = true;
    
    if (this.isEditMode && this.alumnoId) {
      // Actualizar alumno existente
      console.log('Enviando datos para actualizar:', this.newAlumno);
      
      // Preparar los datos para enviar al servidor
      // Creamos una copia del objeto para no modificar el original
      const alumnoData: Usuario = {
        id: this.newAlumno.id,
        dni: this.newAlumno.dni,
        nombre: this.newAlumno.nombre,
        apellido: this.newAlumno.apellido,
        rol: this.newAlumno.rol,
        email: this.newAlumno.email,
        // Usar undefined en lugar de null para las fechas opcionales
        fecha_nacimiento: this.newAlumno.fecha_nacimiento || undefined,
        fecha_ingreso: this.newAlumno.fecha_ingreso || undefined,
        fecha_fin: this.newAlumno.fecha_fin,
        telefono: this.newAlumno.telefono,
        foto_perfil_url: this.newAlumno.foto_perfil_url
      };
      
      this.usuarioService.actualizarUsuario(this.alumnoId, alumnoData).subscribe({
        next: (response) => {
          console.log('Actualización exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Alumno ${this.newAlumno.nombre} ${this.newAlumno.apellido} actualizado correctamente.`;
          
          // Cargar los alumnos de nuevo para mostrar los cambios
          this.loadAlumnos();
          
          // Resetear el modo edición
          this.isEditMode = false;
          this.alumnoId = 0;
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al actualizar el alumno:', err);
          this.handleError(err, 'actualizar');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo alumno
      this.usuarioService.registrarUsuario({
        ...this.newAlumno,
        contrasena: this.newAlumno.dni 
      }).subscribe({
        next: (response) => {
          console.log('Registro exitoso:', response);
          this.showNewForm = false;
          this.successMessage = `Alumno ${this.newAlumno.nombre} ${this.newAlumno.apellido} creado correctamente.`;
          
          // Asegurarse de que estamos en la primera página para ver el nuevo alumno
          this.currentPage = 1;
          
          // Cargar los alumnos de nuevo para mostrar el recién creado
          this.loadAlumnos();
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al crear el alumno:', err);
          this.handleError(err, 'crear');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
  
  validateAlumno(alumno: Usuario): boolean {
    if (!alumno.dni.trim()) {
      this.error = 'El DNI es obligatorio';
      return false;
    }
    
    if (!alumno.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }
    
    if (!alumno.apellido.trim()) {
      this.error = 'El apellido es obligatorio';
      return false;
    }
    
    if (!alumno.email.trim()) {
      this.error = 'El email es obligatorio';
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(alumno.email)) {
      this.error = 'El formato del email es inválido';
      return false;
    }
    
    return true;
  }

  // Navegación para editar alumno
  navigateToEditAlumno(alumnoId: number): void {
    // En lugar de navegar a otra ruta, cargar el alumno y mostrar el formulario
    this.loadAlumnoById(alumnoId);
  }
  
  /**
   * Carga datos de un alumno por su ID utilizando el servicio
   * 
   * @param alumnoId Identificador del alumno a cargar
   */
  loadAlumnoById(alumnoId: number): void {
    this.loading = true;
    this.error = '';
    
    this.usuarioService.obtenerUsuarioPorId(alumnoId).subscribe({
      next: (response) => {        
        // Extraer los datos del usuario de la respuesta, que puede tener diferentes formatos
        let usuarioData: Usuario | undefined;
        
        // Comprobar si la respuesta es directamente el objeto de usuario
        if ('id' in response && response.id) {
          usuarioData = response as Usuario;
        } 
        // Comprobar si la respuesta tiene un formato con propiedad data
        else if ('data' in response && response.data) {
          usuarioData = response.data;
        }
        
        if (usuarioData) {
          this.newAlumno = {
            ...usuarioData,
            // Formatear fechas si es necesario
            fecha_nacimiento: usuarioData.fecha_nacimiento ? new Date(usuarioData.fecha_nacimiento).toISOString().split('T')[0] : '',
            fecha_ingreso: usuarioData.fecha_ingreso ? new Date(usuarioData.fecha_ingreso).toISOString().split('T')[0] : ''
          };
          this.isEditMode = true;
          this.alumnoId = alumnoId;
          this.showNewForm = true;
          
          // Procesar los cursos matriculados si vienen en la respuesta
          if (usuarioData.cursos_matriculado && Array.isArray(usuarioData.cursos_matriculado)) {
            this.cursosMatriculados = usuarioData.cursos_matriculado;
          } else {
            // Si no vienen en la respuesta, cargarlos usando el servicio de matrícula
            this.cargarCursosAlumno(alumnoId);
          }
          
          // Cargar cursos disponibles para matriculación
          this.cargarCursosDisponibles(alumnoId);
        } else {
          this.error = 'No se pudo cargar la información del alumno.';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar el alumno:', err);
        this.error = 'Error al cargar los datos del alumno. Por favor, intente de nuevo.';
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
      // Error de conflicto (DNI o email duplicado)
      this.error = `Ya existe un usuario con ese DNI o email.`;
    } else if (err.status === 400) {
      // Error de validación
      this.error = `Datos inválidos. Por favor, revise la información proporcionada.`;
    } else {
      // Error genérico
      this.error = `Error al ${accion} el alumno. Por favor, intente de nuevo.`;
    }
  }

  // Eliminar alumno
  eliminarAlumno(alumno: Usuario): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar al alumno "${alumno.nombre} ${alumno.apellido}"?`)) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    this.usuarioService.eliminarUsuario(alumno.id).subscribe({
      next: (response) => {
        console.log('Eliminación exitosa:', response);
        this.successMessage = `Alumno ${alumno.nombre} ${alumno.apellido} eliminado correctamente.`;
        
        // Cargar los alumnos de nuevo para actualizar la lista
        this.loadAlumnos();
        
        // Limpiar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error al eliminar el alumno:', err);
        this.handleError(err, 'eliminar');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Matricula a un alumno en el curso seleccionado
   */
  matricularAlumno(): void {
    if (!this.alumnoId || this.cursoSeleccionado === null) {
      this.error = 'Debe seleccionar un curso para matricular al alumno';
      return;
    }
    
    // Verificar si el alumno ya está matriculado en algún curso
    if (this.cursosMatriculados.length > 0) {
      this.error = 'El alumno ya está matriculado en un curso. Debe eliminar la matrícula actual antes de matricularlo en otro curso.';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Asegúrate de que cursoSeleccionado es un número antes de usarlo
    const cursoId = this.cursoSeleccionado; // Aquí ya no es necesario el as number
    if (cursoId === null) {
      this.error = 'El curso seleccionado no es válido.';
      this.loading = false;
      return;
    }

    this.matriculaService.matricularAlumno(this.alumnoId, cursoId).subscribe({
      next: (response: any) => {
        this.successMessage = 'Alumno matriculado correctamente en el curso.';
        
        // Recargar los cursos del alumno para actualizar las listas
        this.cargarCursosAlumno(this.alumnoId);
        
        // Resetear el curso seleccionado
        this.cursoSeleccionado = null;
        
        // Limpiar el mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
        
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al matricular al alumno:', err);
        if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Error al matricular al alumno en el curso. Por favor, intente de nuevo.';
        }
        this.loading = false;
      }
    });
  }

  /**
   * Cambia el curso de un alumno
   */
  cambiarCurso(): void {
    if (!this.alumnoId || !this.cursoSeleccionado) {
      this.error = 'Debe seleccionar un curso para cambiar';
      return;
    }
    
    // Verificar si el alumno ya está matriculado en algún curso
    if (this.cursosMatriculados.length === 0) {
      this.error = 'El alumno no está matriculado en ningún curso.';
      return;
    }
    
    const cursoActual = this.cursosMatriculados[0];
    if (cursoActual.id === this.cursoSeleccionado) {
      this.error = 'El alumno ya está matriculado en este curso';
      return;
    }
    
    if (!confirm(`¿Estás seguro de que deseas cambiar la matrícula del alumno del curso "${cursoActual.nombre}" al nuevo curso seleccionado?`)) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Primero eliminamos la matrícula actual
    this.matriculaService.eliminarMatricula(this.alumnoId, cursoActual.id).subscribe({
      next: () => {
        // Luego matriculamos al alumno en el nuevo curso
        // Ya hemos verificado que cursoSeleccionado no es null en las validaciones iniciales
        const cursoId = this.cursoSeleccionado as number;
        this.matriculaService.matricularAlumno(this.alumnoId, cursoId).subscribe({
          next: (response: any) => {
            this.successMessage = 'Matrícula cambiada correctamente.';
            
            // Recargar los cursos del alumno para actualizar las listas
            this.cargarCursosAlumno(this.alumnoId);
            
            // Resetear el curso seleccionado
            this.cursoSeleccionado = null;
            
            // Limpiar el mensaje de éxito después de 5 segundos
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
            
            this.loading = false;
          },
          error: (err: any) => {
            console.error('Error al matricular al alumno en el nuevo curso:', err);
            if (err.error && err.error.message) {
              this.error = err.error.message;
            } else {
              this.error = 'Error al cambiar la matrícula. Por favor, intente de nuevo.';
            }
            this.loading = false;
            
            // Recargar los cursos para asegurarnos de tener el estado actual
            this.cargarCursosAlumno(this.alumnoId);
          }
        });
      },
      error: (err: any) => {
        console.error('Error al eliminar la matrícula actual:', err);
        if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Error al cambiar la matrícula. Por favor, intente de nuevo.';
        }
        this.loading = false;
      }
    });
  }

  /**
   * Carga los cursos disponibles y matriculados para un alumno
   * 
   * @param alumnoId Identificador del alumno
   */
  cargarCursosAlumno(alumnoId: number | null): void {
    if (!alumnoId) return;
    
    this.loadingCursos = true;
    
    // Obtener cursos matriculados
    this.matriculaService.obtenerCursosDeAlumno(alumnoId).subscribe({
      next: (response: RespuestaPaginada<Curso>) => {
        if (response && response.data) {
          this.cursosMatriculados = response.data;
        } else {
          this.cursosMatriculados = [];
        }
        
        // Después de obtener los cursos matriculados, cargar los disponibles
        this.cargarCursosDisponibles(alumnoId);
      },
      error: (err: any) => {
        console.error('Error al cargar los cursos del alumno:', err);
        this.cursosMatriculados = [];
        this.loadingCursos = false;
      }
    });
  }
  
  /**
   * Carga los cursos disponibles para matricular a un alumno
   * 
   * @param alumnoId Identificador del alumno
   */
  cargarCursosDisponibles(alumnoId: number | null): void {
    if (!alumnoId) return;
    
    this.matriculaService.obtenerCursosDisponibles(alumnoId).subscribe({
      next: (response: RespuestaPaginada<Curso>) => {
        if (response && response.data) {
          this.cursosDisponibles = response.data;
        } else {
          this.cursosDisponibles = [];
        }
        this.loadingCursos = false;
      },
      error: (err: any) => {
        console.error('Error al cargar los cursos disponibles:', err);
        this.cursosDisponibles = [];
        this.loadingCursos = false;
      }
    });
  }

  eliminarMatricula(cursoId: number): void {
    if (!this.alumnoId) {
      this.error = 'No se ha seleccionado ningún alumno.';
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar la matrícula del curso con ID ${cursoId}?`)) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.matriculaService.eliminarMatricula(this.alumnoId, cursoId).subscribe({
      next: (response) => {
        this.successMessage = 'Matrícula eliminada correctamente.';
        this.cargarCursosAlumno(this.alumnoId); // Recargar cursos para actualizar la lista
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error al eliminar la matrícula:', err);
        this.error = 'Error al eliminar la matrícula. Por favor, intente de nuevo.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}