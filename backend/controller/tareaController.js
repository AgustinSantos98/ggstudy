const tareaModel = require('../models/tareaModel');
const temaModel = require('../models/temaModel'); // Para validaciones

exports.crearTarea = async (req, res) => {
  try {
    const { tema_id, titulo, descripcion, fecha_entrega, visible, archivo } = req.body;
    
    if (!req.user || !req.user.id || !req.user.rol) {
        return res.status(401).json({ message: 'Usuario no autenticado o rol no definido.' });
    }
    const creado_por = req.user.id;

    if (!tema_id || !titulo) {
      return res.status(400).json({ message: 'El ID del tema y el título son obligatorios.' });
    }

    const temaExistente = await temaModel.obtenerPorId(tema_id);
    if (!temaExistente) {
      return res.status(404).json({ message: 'El tema especificado no existe.' });
    }

    if (!['profesor', 'admin'].includes(req.user.rol)) {
        return res.status(403).json({ message: 'Solo profesores o administradores pueden crear tareas.' });
    }

    const nuevaTareaId = await tareaModel.crear({ tema_id, titulo, descripcion, fecha_entrega, visible, archivo, creado_por });
    res.status(201).json({ message: 'Tarea creada exitosamente', tareaId: nuevaTareaId });
  } catch (err) {
    console.error("Error al crear tarea:", err);
    res.status(500).json({ message: 'Error al crear tarea', error: err.message });
  }
};

exports.obtenerTareas = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { temaId, creadorId, titulo, visibles, profesorId } = req.query;
    let resultado;
    
    if (!req.user || !req.user.rol) {
        return res.status(401).json({ message: 'Usuario no autenticado o rol no definido.' });
    }
    const esAlumno = req.user.rol === 'alumno';
    const esProfesor = req.user.rol === 'profesor';
    // Por defecto, los alumnos solo ven visibles, a menos que el filtro 'visibles' diga explícitamente 'false' (lo cual es raro para un alumno)
    // Profesores/Admins ven todo a menos que 'visibles' sea 'true' explícitamente.
    let soloVisiblesParaConsulta = esAlumno ? true : (visibles === 'true'); // Si es alumno, por defecto true. Si no, lo que diga `visibles`.
    if (visibles === 'false' && !esAlumno) soloVisiblesParaConsulta = false; // Admin/Profesor puede pedir explícitamente ver solo no visibles o todas.
    if (visibles === undefined && !esAlumno) soloVisiblesParaConsulta = false; // Admin/Profesor ve todas por defecto si no se especifica

    // Si el usuario es profesor, solo debe ver las tareas de sus asignaturas asignadas
    if (esProfesor) {
      // Si se proporciona profesorId en la consulta, verificar que coincida con el ID del usuario actual
      if (profesorId && profesorId !== req.user.id.toString()) {
        return res.status(403).json({ message: 'No tienes permiso para ver las tareas de otro profesor.' });
      }
      
      // Usar el ID del profesor actual para filtrar las tareas
      resultado = await tareaModel.obtenerPorProfesorIdPaginado(req.user.id, page, limit, soloVisiblesParaConsulta);
    } else {
      // Para administradores y alumnos, mantener la lógica original
      if (titulo) {
          resultado = await tareaModel.buscarPorTituloPaginado(titulo, page, limit);
          // Aquí se podría aplicar un filtro de visibilidad adicional si es un alumno y el modelo no lo hace.
      } else if (temaId) {
        const temaExistente = await temaModel.obtenerPorId(temaId);
        if (!temaExistente) {
          return res.status(404).json({ message: 'Tema no encontrado' });
        }
        resultado = await tareaModel.obtenerPorTemaIdPaginado(temaId, page, limit, soloVisiblesParaConsulta);
      } else if (creadorId) {
        resultado = await tareaModel.obtenerPorCreadorIdPaginado(creadorId, page, limit);
        // Aquí también podría aplicar filtro de visibilidad si el que consulta es alumno y no es su propia tarea (caso raro)
      } else if (profesorId) {
        // Permitir a los administradores filtrar por profesor_id
        resultado = await tareaModel.obtenerPorProfesorIdPaginado(profesorId, page, limit, soloVisiblesParaConsulta);
      } else {
        resultado = await tareaModel.obtenerTodosPaginado(page, limit, soloVisiblesParaConsulta);
      }
    }
    
    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

exports.obtenerTareaPorId = async (req, res) => {
  try {
    if (!req.user || !req.user.rol) {
        return res.status(401).json({ message: 'Usuario no autenticado o rol no definido.' });
    }
    const tarea = await tareaModel.obtenerPorId(req.params.id);
    if (!tarea) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    if (req.user.rol === 'alumno' && !tarea.visible) {
        return res.status(403).json({ message: 'No tiene permiso para ver esta tarea.' });
    }
    res.json(tarea);
  } catch (err) {
    console.error("Error al obtener tarea por ID:", err);
    res.status(500).json({ message: 'Error al obtener tarea', error: err.message });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user || !req.user.id || !req.user.rol) {
        return res.status(401).json({ message: 'Usuario no autenticado o rol no definido.' });
    }
    const tareaExistente = await tareaModel.obtenerPorId(id);

    if (!tareaExistente) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (req.user.rol !== 'admin' && tareaExistente.creado_por !== req.user.id) {
        return res.status(403).json({ message: 'No tiene permiso para actualizar esta tarea.' });
    }

    const { tema_id, titulo, descripcion, fecha_entrega, visible, archivo } = req.body;
    if (tema_id) {
        const temaValido = await temaModel.obtenerPorId(tema_id);
        if (!temaValido) {
            return res.status(400).json({ message: 'El tema especificado para actualizar no existe.' });
        }
    }

    const datosActualizar = { tema_id, titulo, descripcion, fecha_entrega, visible, archivo }; 

    const tareaActualizada = await tareaModel.actualizar(id, datosActualizar);
    // El modelo tareaModel.actualizar devuelve true/false. Si es true, obtener el objeto actualizado.
    if (!tareaActualizada) {
      // Podría ser que no hubo cambios o la tarea no se encontró (aunque ya lo verificamos).
      // Devolver la tarea existente si no hubo cambios efectivos puede ser una opción.
      const currentTarea = await tareaModel.obtenerPorId(id);
      return res.status(200).json({ message: 'No se realizaron cambios en la tarea o la tarea no requiere actualización.', tarea: currentTarea });
    }
    const tareaModificada = await tareaModel.obtenerPorId(id);
    res.json({ message: 'Tarea actualizada exitosamente', tarea: tareaModificada });
  } catch (err) {
    console.error("Error al actualizar tarea:", err);
    res.status(500).json({ message: 'Error al actualizar tarea', error: err.message });
  }
};

exports.eliminarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user || !req.user.id || !req.user.rol) {
        return res.status(401).json({ message: 'Usuario no autenticado o rol no definido.' });
    }
    const tareaExistente = await tareaModel.obtenerPorId(id);

    if (!tareaExistente) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (req.user.rol !== 'admin' && tareaExistente.creado_por !== req.user.id) {
        return res.status(403).json({ message: 'No tiene permiso para eliminar esta tarea.' });
    }

    await tareaModel.eliminar(id);
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (err) {
    console.error("Error al eliminar tarea:", err);
    if (err.message && err.message.includes('calificaciones asociadas')) {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al eliminar tarea', error: err.message });
  }
};

exports.cambiarVisibilidadTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { visible } = req.body;

        if (!req.user || !req.user.id || !req.user.rol) {
            return res.status(401).json({ message: 'Usuario no autenticado o rol no definido.' });
        }
        if (typeof visible !== 'boolean') {
            return res.status(400).json({ message: "El campo 'visible' debe ser un valor booleano." });
        }

        const tareaExistente = await tareaModel.obtenerPorId(id);
        if (!tareaExistente) {
            return res.status(404).json({ message: "Tarea no encontrada." });
        }

        if (req.user.rol !== 'admin' && tareaExistente.creado_por !== req.user.id) {
            return res.status(403).json({ message: 'No tiene permiso para cambiar la visibilidad de esta tarea.' });
        }

        const actualizada = await tareaModel.actualizar(id, { visible });
        // Similar a actualizar, chequear si realmente hubo un cambio.
        const tareaModificada = await tareaModel.obtenerPorId(id);
        if (tareaExistente.visible === tareaModificada.visible && !actualizada) {
             return res.status(200).json({ message: `La visibilidad de la tarea no cambió (ya estaba en ${visible}).`, tarea: tareaModificada });
        }
        res.json({ message: `Visibilidad de la tarea cambiada a ${visible}.`, tarea: tareaModificada });
    } catch (error) {
        console.error("Error al cambiar visibilidad de tarea:", error);
        res.status(500).json({ message: "Error al cambiar visibilidad de tarea", error: error.message });
    }
}; 

/**
 * Obtiene todas las tareas de un tema específico con información de entregas para el alumno actual
 * 
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerTareasPorTemaParaAlumno = async (req, res) => {
    try {
        const { temaId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }
        
        const usuarioId = req.user.id;
        const esAlumno = req.user.rol === 'alumno';
        const esProfesorOAdmin = ['profesor', 'admin'].includes(req.user.rol);
        
        // Verificar que el tema existe
        const temaExiste = await temaModel.obtenerPorId(temaId);
        if (!temaExiste) {
            return res.status(404).json({ message: 'Tema no encontrado.' });
        }
        
        // Si es alumno, verificar que tiene acceso al tema (está matriculado en el curso)
        if (esAlumno) {
            const tieneAcceso = await tareaModel.verificarAccesoAlumnoATema(usuarioId, temaId);
            if (!tieneAcceso) {
                return res.status(403).json({ message: 'No tienes acceso a este tema.' });
            }
        }
        
        // Obtener tareas del tema (solo visibles para alumnos, todas para profesores/admin)
        const soloVisibles = esAlumno;
        const tareas = await tareaModel.obtenerPorTema(temaId, soloVisibles, limit, offset);
        const total = await tareaModel.contarPorTema(temaId, soloVisibles);
        
        // Si es alumno, obtener información de sus entregas para estas tareas
        if (esAlumno) {
            // Obtener IDs de las tareas
            const tareaIds = tareas.map(tarea => tarea.id);
            
            // Obtener entregas del alumno para estas tareas
            const entregas = await tareaModel.obtenerEntregasDeAlumno(usuarioId, tareaIds);
            
            // Mapear entregas a las tareas correspondientes
            const tareasConEntregas = tareas.map(tarea => {
                const entrega = entregas.find(e => e.tarea_id === tarea.id);
                return {
                    ...tarea,
                    entregado: !!entrega,
                    entrega: entrega ? {
                        id: entrega.id,
                        fecha_entrega: entrega.fecha_entrega,
                        calificacion: entrega.calificacion,
                        fecha_correccion: entrega.fecha_correccion,
                        feedback: entrega.feedback,
                        url: entrega.url,
                        texto: entrega.texto
                    } : null
                };
            });
            
            // Devolver respuesta paginada
            return res.json({
                data: tareasConEntregas,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        
        // Para profesores/admin, devolver solo las tareas sin información de entregas
        return res.json({
            data: tareas,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (err) {
        console.error("Error al obtener tareas por tema para alumno:", err);
        res.status(500).json({ message: 'Error al obtener tareas', error: err.message });
    }
};

/**
 * Obtiene todas las tareas asociadas al curso en el que está matriculado el alumno actual
 * 
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.obtenerTareasCursoAlumno = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }
        
        const usuarioId = req.user.id;
        const esAlumno = req.user.rol === 'alumno';
        
        // Solo los alumnos pueden usar este endpoint
        if (!esAlumno) {
            return res.status(403).json({ message: 'Este endpoint es solo para alumnos.' });
        }
        
        // Obtener todas las tareas del curso del alumno con información de entregas
        const tareasConEntregas = await tareaModel.obtenerTareasCursoAlumno(usuarioId, true);
        
        if (!Array.isArray(tareasConEntregas)) {
            console.error('El modelo no devuelve un array:', typeof tareasConEntregas);
            return res.status(500).json({ message: 'Error interno del servidor: formato de datos incorrecto' });
        }
        
        // Aplicar paginación en memoria
        const total = tareasConEntregas.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const tareasConEntregasPaginadas = tareasConEntregas.slice(startIndex, endIndex);
        
        // Devolver respuesta paginada
        return res.json({
            data: tareasConEntregasPaginadas,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (err) {
        console.error("Error al obtener tareas del curso del alumno:", err);
        res.status(500).json({ message: 'Error al obtener tareas', error: err.message });
    }
}