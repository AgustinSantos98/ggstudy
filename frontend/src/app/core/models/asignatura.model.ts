/**
 * Interfaz que representa una asignatura académica en el sistema.
 * 
 * Una asignatura es una materia o curso que pertenece a un curso académico
 * y puede ser impartida por un profesor.
 */
export interface Asignatura {
  /** Identificador único de la asignatura */
  id: number;
  
  /** Identificador del curso al que pertenece esta asignatura */
  curso_id: number;
  
  /** Nombre de la asignatura */
  nombre: string;
  
  /** Descripción detallada de la asignatura */
  descripcion?: string;
  

  /** Identificador del profesor asignado a esta asignatura */
  profesor_id?: number;
  
  /** Nombre del curso al que pertenece (para visualización) */
  curso_nombre?: string;
  
  /** Nombre del profesor asignado a esta asignatura (para visualización) */
  profesor_nombre?: string;
  
  /** Apellido del profesor asignado a esta asignatura (para visualización) */
  profesor_apellido?: string;
  
  /** Número de temas que contiene esta asignatura */
  temasCount?: number;
}