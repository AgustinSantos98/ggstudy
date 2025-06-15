const TareaCalificacionModel = require('../models/tareaCalificacionModel');
const TareaModel = require('../models/tareaModel');
const UsuarioModel = require('../models/usuarioModel');

// Entregar una tarea (Alumno)
exports.crearEntrega = async (req, res) => {
    try {
        const { tarea_id, url, texto } = req.body;
        const usuario_id = req.user.id; // Alumno autenticado

        if (!tarea_id) {
            return res.status(400).json({ message: 'El ID de la tarea es obligatorio.' });
        }
        if (!url && !texto) {
            return res.status(400).json({ message: 'Debe proporcionar una URL o un texto para la entrega.' });
        }

        // Verificar que la tarea exista y esté visible (o que el usuario sea admin/profesor)
        const tarea = await TareaModel.obtenerPorId(tarea_id);
        if (!tarea) {
            return res.status(404).json({ message: 'La tarea no existe.' });
        }
        if (!tarea.visible && req.user.rol === 'alumno') {
            return res.status(403).json({ message: 'Esta tarea no está visible actualmente para entregas.' });
        }
        
        // Verificar que el usuario sea un alumno
        if (req.user.rol !== 'alumno') {
             return res.status(403).json({ message: 'Solo los alumnos pueden entregar tareas.' });
        }
        
        // Verificar si ya existe una entrega para este alumno y tarea
        const entregaExistente = await TareaCalificacionModel.obtenerPorUsuarioYTarea(usuario_id, tarea_id);
        if (entregaExistente) {
            return res.status(409).json({ message: 'Ya has realizado una entrega para esta tarea. Puedes actualizarla si aún no ha sido calificada.' });
        }

        const nuevaEntregaId = await TareaCalificacionModel.crear({
            usuario_id,
            tarea_id,
            url: url || null,
            texto: texto || null
        });
        const nuevaEntrega = await TareaCalificacionModel.obtenerPorId(nuevaEntregaId);
        res.status(201).json({ message: 'Tarea entregada exitosamente', entrega: nuevaEntrega });
    } catch (error) {
        console.error("Error al crear entrega:", error);
        if (error.message.includes('Ya existe una entrega') || error.message.includes('no existe')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error del servidor al entregar la tarea.', error: error.message });
    }
};

// Calificar una entrega (Profesor/Admin)
exports.calificarEntrega = async (req, res) => {
    try {
        const entrega_id = req.params.id;
        const { calificacion, feedback } = req.body;
        const corregido_por = req.user.id; // Profesor/Admin autenticado

        if (calificacion === undefined || calificacion === null) { // Permitir 0 como calificación
            return res.status(400).json({ message: 'La calificación es obligatoria.' });
        }
        if (parseFloat(calificacion) < 0 || parseFloat(calificacion) > 1000) { // Ajustar según escala
             return res.status(400).json({ message: 'La calificación debe estar en un rango válido.' });
        }

        const entrega = await TareaCalificacionModel.obtenerPorId(entrega_id);
        if (!entrega) {
            return res.status(404).json({ message: 'La entrega no fue encontrada.' });
        }

        // Verificar que quien califica es profesor o admin
        if (!['profesor', 'admin'].includes(req.user.rol)) {
            return res.status(403).json({ message: 'No tiene permisos para calificar esta tarea.' });
        }

        const actualizada = await TareaCalificacionModel.actualizarCalificacion(entrega_id, {
            calificacion: parseFloat(calificacion),
            feedback: feedback || null,
            corregido_por
        });

        if (actualizada) {
            const entregaActualizada = await TareaCalificacionModel.obtenerPorId(entrega_id);
            res.json({ message: 'Entrega calificada exitosamente', entrega: entregaActualizada });
        } else {
            res.status(500).json({ message: 'No se pudo actualizar la calificación.' });
        }
    } catch (error) {
        console.error("Error al calificar entrega:", error);
         if (error.message.includes('no existe')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error del servidor al calificar la tarea.', error: error.message });
    }
};

// Obtener una entrega/calificación por su ID
exports.obtenerCalificacionPorId = async (req, res) => {
    try {
        const entrega_id = req.params.id;
        const entrega = await TareaCalificacionModel.obtenerPorId(entrega_id);

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega/Calificación no encontrada.' });
        }

        if (req.user.rol === 'alumno' && entrega.usuario_id !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para ver esta entrega.' });
        }

        res.json(entrega);
    } catch (error) {
        console.error("Error al obtener calificación:", error);
        res.status(500).json({ message: 'Error del servidor.', error: error.message });
    }
};

// Obtener todas las entregas para una tarea específica (Profesor/Admin)
exports.obtenerEntregasPorTarea = async (req, res) => {
    try {
        const tarea_id = req.params.tareaId; // Asumiendo que la ruta es /tareas/:tareaId/entregas
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const tarea = await TareaModel.obtenerPorId(tarea_id);
        if(!tarea) return res.status(404).json({ message: 'Tarea no encontrada.' });

        // Permisos: Solo admin o el profesor creador de la tarea (o profesor de la asignatura)
        if (req.user.rol !== 'admin' && (req.user.rol !== 'profesor' || tarea.creado_por !== req.user.id)) {
             return res.status(403).json({ message: 'No tienes permisos para ver las entregas de esta tarea.' });
        }

        const resultado = await TareaCalificacionModel.obtenerPorTareaId(tarea_id, page, limit);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener entregas por tarea:", error);
        res.status(500).json({ message: 'Error del servidor.', error: error.message });
    }
};

// Obtener todas las entregas asociadas a las asignaturas de un profesor
exports.obtenerEntregasPorProfesor = async (req, res) => {
    try {
        // Obtener el ID del profesor de los parámetros de la consulta
        const profesorId = req.query.profesorId || req.user.id;
        
        // Verificar que el usuario tenga permisos para ver estas entregas
        if (req.user.rol !== 'admin' && req.user.rol !== 'profesor' && req.user.id !== parseInt(profesorId)) {
            return res.status(403).json({ message: 'No tienes permisos para ver estas entregas.' });
        }
        
        // Obtener parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // Obtener las entregas
        const resultado = await TareaCalificacionModel.obtenerPorProfesorId(profesorId, page, limit);
        
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener entregas por profesor:', error);
        res.status(500).json({ message: 'Error al obtener las entregas.', error: error.message });
    }
};

// Obtener todas las calificaciones/entregas de un alumno (Alumno para sí mismo, Profesor/Admin)
exports.obtenerMisCalificaciones = async (req, res) => { // Para un alumno
    try {
        const usuario_id = req.user.id; // Alumno autenticado ve las suyas
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        if(req.user.rol !== 'alumno'){
            return res.status(403).json({ message: 'Esta ruta es solo para alumnos.' });
        }

        const resultado = await TareaCalificacionModel.obtenerPorUsuarioId(usuario_id, page, limit);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener mis calificaciones:", error);
        res.status(500).json({ message: 'Error del servidor.', error: error.message });
    }
};

exports.obtenerCalificacionesDeAlumno = async (req, res) => { // Para admin/profesor viendo a un alumno específico
    try {
        const alumno_id = req.params.alumnoId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Permiso: Admin o Profesor (un profesor podría ver solo alumnos de sus cursos/asignaturas - lógica adicional)
        if (!['admin', 'profesor'].includes(req.user.rol)) {
            return res.status(403).json({ message: 'No tienes permisos para ver calificaciones de este alumno.' });
        }
        
        const alumno = await UsuarioModel.obtenerPorId(alumno_id);
        if(!alumno || alumno.rol !== 'alumno'){
            return res.status(404).json({ message: 'Alumno no encontrado.' });
        }

        const resultado = await TareaCalificacionModel.obtenerPorUsuarioId(alumno_id, page, limit);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener calificaciones de alumno:", error);
        res.status(500).json({ message: 'Error del servidor.', error: error.message });
    }
}

// Actualizar una entrega (Alumno, si no está calificada)
exports.actualizarMiEntrega = async (req, res) => {
    try {
        const entrega_id = req.params.id; // ID de la TareaCalificacion
        const usuario_id = req.user.id;
        const { url, texto } = req.body;

        if (!url && !texto) {
            return res.status(400).json({ message: 'Debe proporcionar una URL o un texto para actualizar la entrega.' });
        }

        const entrega = await TareaCalificacionModel.obtenerPorId(entrega_id);
        if (!entrega) {
            return res.status(404).json({ message: 'La entrega no existe.' });
        }
        if (entrega.usuario_id !== usuario_id) {
            return res.status(403).json({ message: 'No puedes actualizar una entrega que no es tuya.' });
        }
        if (entrega.calificacion !== null) {
            return res.status(403).json({ message: 'No puedes actualizar una entrega que ya ha sido calificada.' });
        }

        const actualizada = await TareaCalificacionModel.actualizarEntregaAlumno(entrega_id, usuario_id, { url, texto });
        if (actualizada) {
            const entregaActualizada = await TareaCalificacionModel.obtenerPorId(entrega_id);
            res.json({ message: 'Entrega actualizada exitosamente', entrega: entregaActualizada });
        } else {
            res.status(400).json({ message: 'No se pudo actualizar la entrega (quizás ya está calificada o no se encontró).' });
        }
    } catch (error) {
        console.error("Error al actualizar entrega:", error);
        res.status(500).json({ message: 'Error del servidor.', error: error.message });
    }
};


// Eliminar una entrega (Alumno si no calificada, o Admin/Profesor con permisos)
exports.eliminarEntrega = async (req, res) => {
    try {
        const entrega_id = req.params.id;
        const entrega = await TareaCalificacionModel.obtenerPorId(entrega_id);

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega no encontrada.' });
        }

        // Lógica de permisos para eliminar:
        // 1. Alumno puede eliminar SU entrega SI NO está calificada.
        // 2. Profesor puede eliminar entregas de tareas que él creó o de sus asignaturas.
        // 3. Admin puede eliminar cualquier entrega.
        let puedeEliminar = false;
        if (req.user.rol === 'admin') {
            puedeEliminar = true;
        } else if (req.user.rol === 'alumno' && entrega.usuario_id === req.user.id && entrega.calificacion === null) {
            puedeEliminar = true;
        } else if (req.user.rol === 'profesor') {
            const tarea = await TareaModel.obtenerPorId(entrega.tarea_id);
             if (tarea && tarea.creado_por === req.user.id) {
                 puedeEliminar = true;
             }
        }

        if (!puedeEliminar) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar esta entrega o ya ha sido calificada.' });
        }

        const eliminada = await TareaCalificacionModel.eliminar(entrega_id);
        if (eliminada) {
            res.json({ message: 'Entrega eliminada correctamente.' });
        } else {
            res.status(500).json({ message: 'No se pudo eliminar la entrega.' });
        }
    } catch (error) {
        console.error("Error al eliminar entrega:", error);
        res.status(500).json({ message: 'Error del servidor.', error: error.message });
    }
};