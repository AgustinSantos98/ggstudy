import { Curso } from './curso.model';

/**
 * Interfaz que representa a un usuario en el sistema.
 * 
 * Contiene toda la información personal y de acceso de los usuarios,
 * ya sean alumnos, profesores o administradores.
 */
export interface Usuario {
  /** Identificador único del usuario */
  id: number;
  
  /** Documento Nacional de Identidad, único para cada usuario */
  dni: string;
  
  /** Nombre del usuario */
  nombre: string;
  
  /** Apellido del usuario */
  apellido: string;
  
  /** Rol del usuario en el sistema, determina sus permisos y acceso */
  rol: 'alumno' | 'profesor' | 'admin';
  
  /** Correo electrónico del usuario, utilizado para iniciar sesión */
  email: string;
  
  /** Fecha de nacimiento del usuario (opcional) */
  fecha_nacimiento?: string;
  
  /** Fecha en que el usuario ingresó al sistema (opcional) */
  fecha_ingreso?: string;
  
  /** Fecha en que el usuario finalizó su relación con la institución (opcional) */
  fecha_fin?: string;
  
  /** Número de teléfono del usuario (opcional) */
  telefono?: string;
  
  /** URL de la imagen de perfil del usuario (opcional) */
  foto_perfil_url?: string;
  
  /** Cursos en los que está matriculado el alumno (solo para rol 'alumno') */
  cursos_matriculado?: Curso[];
}