const asignaturaModel = require('../models/asignaturaModel');
const cursoModel = require('../models/cursoModel'); // Para validaciones
const usuarioModel = require('../models/usuarioModel'); // Para validaciones de profesor
const temaModel = require('../models/temaModel'); // Para obtener temas de una asignatura

exports.crearAsignatura = async (req, res) => {
  try {
    const { curso_id, nombre, descripcion, profesor_id } = req.body;

    if (!curso_id || !nombre) {
      return res.status(400).json({ message: 'El ID del curso y el nombre de la asignatura son obligatorios.' });
    }

    const cursoExistente = await cursoModel.obtenerPorId(curso_id);
    if (!cursoExistente) {
      return res.status(404).json({ message: 'El curso especificado no existe.' });
    }

    if (profesor_id) {
      const profesor = await usuarioModel.obtenerPorId(profesor_id);
      if (!profesor || profesor.rol !== 'profesor') {
        return res.status(400).json({ message: 'El ID de profesor proporcionado no es válido o el usuario no es un profesor.' });
      }
    }

    const nuevaAsignaturaId = await asignaturaModel.crear({ curso_id, nombre, descripcion, profesor_id });
    res.status(201).json({ message: 'Asignatura creada exitosamente', asignaturaId: nuevaAsignaturaId });
  } catch (error) {
    console.error("Error al crear asignatura:", error);
    res.status(500).json({ message: 'Error al crear asignatura', error: error.message });
  }
};

exports.obtenerAsignaturas = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { cursoId, profesorId, nombre } = req.query;
    let resultado;

    if (nombre) {
      resultado = await asignaturaModel.buscarPorNombrePaginado(nombre, page, limit);
    } else if (cursoId) {
      resultado = await asignaturaModel.obtenerPorCursoIdPaginado(cursoId, page, limit);
    } else if (profesorId) {
      resultado = await asignaturaModel.obtenerPorProfesorIdPaginado(profesorId, page, limit);
    } else {
      resultado = await asignaturaModel.obtenerTodosPaginado(page, limit);
    }
    
    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener asignaturas:", error);
    res.status(500).json({ message: 'Error al obtener asignaturas', error: error.message });
  }
};

exports.obtenerAsignaturaPorId = async (req, res) => {
  try {
    const asignatura = await asignaturaModel.obtenerPorId(req.params.id);
    if (!asignatura) {
      return res.status(404).json({ message: 'Asignatura no encontrada' });
    }
    const temas = await temaModel.obtenerPorAsignaturaId(asignatura.id);
    let profesorInfo = null;
    if (asignatura.profesor_id) {
        const profesor = await usuarioModel.obtenerPorId(asignatura.profesor_id);
        if (profesor) {
            const { contrasena, ...profesorSinPwd } = profesor;
            profesorInfo = profesorSinPwd;
        }
    }
    res.json({ ...asignatura, profesor: profesorInfo, temas });
  } catch (err) {
    console.error("Error al obtener asignatura por ID:", err);
    res.status(500).json({ message: 'Error al obtener asignatura', error: err.message });
  }
};

exports.actualizarAsignatura = async (req, res) => {
  try {
    const { id } = req.params;
    const { curso_id, nombre, descripcion, profesor, profesor_id } = req.body;
    const profesorId = profesor.id;

    // Verificar si el usuario es profesor y está intentando cambiar el profesor_id
    if (profesor.rol === 'profesor' && profesorId) {
      // Obtener la asignatura actual para comparar
      const asignaturaActual = await asignaturaModel.obtenerPorId(id);
      if (!asignaturaActual) {
        return res.status(404).json({ message: 'Asignatura no encontrada' });
      }
      
      // Si el profesor_id es diferente y el usuario no es admin, no permitir el cambio
      if (Number(asignaturaActual.profesor_id) !== Number(profesor_id) && req.user.rol !== 'admin') {
        return res.status(403).json({ 
          message: 'No tienes permisos para cambiar el profesor asignado a esta asignatura. Solo los administradores pueden realizar esta acción.'
        });
      }
    }

    // Validar el profesor_id si se proporciona
    if (profesorId) {
      const profesor = await usuarioModel.obtenerPorId(profesorId);
      if (!profesor || profesor.rol !== 'profesor') {
        return res.status(400).json({ message: 'El ID de profesor proporcionado no es válido o el usuario no es un profesor.' });
      }
    }
    
    // Validar el curso_id si se proporciona
    if (curso_id){
        const cursoExistente = await cursoModel.obtenerPorId(curso_id);
        if (!cursoExistente) {
            return res.status(404).json({ message: 'El curso especificado para actualizar no existe.' });
        }
    }

    const asignaturaActualizada = await asignaturaModel.actualizar(id, { curso_id, nombre, descripcion, profesor_id });
    if (!asignaturaActualizada) {
        return res.status(404).json({ message: 'Asignatura no encontrada o sin cambios necesarios' });
    }
    res.json({ message: 'Asignatura actualizada exitosamente' });
  } catch (err) {
    console.error("Error al actualizar asignatura:", err);
    res.status(500).json({ message: 'Error al actualizar asignatura', error: err.message });
  }
};

exports.eliminarAsignatura = async (req, res) => {
  try {
    const resultado = await asignaturaModel.eliminar(req.params.id);
    if (!resultado) {
        return res.status(404).json({ message: 'Asignatura no encontrada' });
    }
    res.json({ message: 'Asignatura eliminada exitosamente' });
  } catch (err) {
    console.error("Error al eliminar asignatura:", err);
    if (err.message && err.message.includes('temas asociados')) {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al eliminar asignatura', error: err.message });
  }
};

exports.obtenerAsignaturasPorCurso = async (req, res) => {
  try {
    const cursoId = req.params.cursoId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (!cursoId) {
      return res.status(400).json({ message: 'El ID del curso es obligatorio.' });
    }

    // Verificar si el curso existe
    const cursoExistente = await cursoModel.obtenerPorId(cursoId);
    if (!cursoExistente) {
      return res.status(404).json({ message: 'El curso especificado no existe.' });
    }

    // Obtener asignaturas paginadas del curso
    const resultado = await asignaturaModel.obtenerPorCursoIdPaginado(cursoId, page, limit);
    
    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener asignaturas por curso:", error);
    res.status(500).json({ message: 'Error al obtener asignaturas por curso', error: error.message });
  }
};

exports.obtenerTemasPorAsignatura = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const asignaturaExistente = await asignaturaModel.obtenerPorId(id);
        if (!asignaturaExistente) {
            return res.status(404).json({ message: 'Asignatura no encontrada' });
        }

        const resultado = await temaModel.obtenerPorAsignaturaIdPaginado(id, page, limit);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener temas por asignatura:", error);
        res.status(500).json({ message: 'Error al obtener temas por asignatura', error: error.message });
    }
}; 