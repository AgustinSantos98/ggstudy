/**
 * Interfaz que representa una tarea académica en el sistema.
 * 
 * Las tareas son actividades asignadas a los alumnos dentro de un tema específico
 * que deben ser completadas y entregadas para su evaluación.
 */
export interface Tarea {
  /** Identificador único de la tarea */
  id: number;
  
  /** Identificador del tema al que pertenece esta tarea */
  tema_id: number;
  
  /** Título descriptivo de la tarea */
  titulo: string;
  
  /** Descripción detallada de la tarea, instrucciones y objetivos */
  descripcion: string;
  
  /** Fecha límite para la entrega de la tarea (opcional) */
  fecha_entrega?: string;
  
  /** Indica si la tarea es visible para los alumnos (por defecto: true) */
  visible?: boolean;
  
  /** Ruta o URL del archivo adjunto a la tarea (opcional) */
  archivo?: string;
  
  /** Identificador del usuario (profesor) que creó la tarea */
  creado_por: number;
}

/**
 * Interfaz extendida de Tarea que incluye información adicional para la vista
 * 
 * Esta interfaz añade propiedades relacionadas con el tema, asignatura, curso y creador
 * que son útiles para mostrar en la interfaz de usuario pero no están directamente
 * en la tabla de tareas.
 */
export interface TareaExtendida extends Tarea {
  /** Nombre del tema al que pertenece la tarea */
  tema_nombre?: string;
  
  /** ID de la asignatura a la que pertenece el tema */
  asignatura_id?: number;
  
  /** Nombre de la asignatura a la que pertenece el tema */
  asignatura_nombre?: string;
  
  /** ID del curso al que pertenece la asignatura */
  curso_id?: number;
  
  /** Nombre del curso al que pertenece la asignatura */
  curso_nombre?: string;
  
  /** Nombre del profesor o administrador que creó la tarea */
  creador_nombre?: string;
  
  /** Apellido del profesor o administrador que creó la tarea */
  creador_apellido?: string;
}

/**
 * Interfaz para tareas con información de entregas del alumno
 * 
 * Esta interfaz extiende TareaExtendida para incluir información sobre si la tarea
 * ha sido entregada por el alumno y los detalles de la entrega.
 */
export interface TareaConEntrega extends TareaExtendida {
  /** Indica si la tarea ha sido entregada por el alumno */
  entregado: boolean;
  
  /** Información detallada de la entrega si existe */
  entrega?: {
    /** ID de la entrega */
    id: number;
    
    /** Fecha en que se realizó la entrega */
    fecha_entrega: string;
    
    /** Calificación asignada (si ha sido corregida) */
    calificacion?: number;
    
    /** Fecha en que se realizó la corrección */
    fecha_correccion?: string;
    
    /** Comentarios del profesor sobre la entrega */
    feedback?: string;
    
    /** URL del archivo entregado */
    url?: string;
    
    /** Texto complementario de la entrega */
    texto?: string;
    
    /** ID del profesor que corrigió la entrega */
    corregido_por?: number;
  };
}