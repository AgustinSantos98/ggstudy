const temaModel = require('../models/temaModel');
const asignaturaModel = require('../models/asignaturaModel');
const tareaModel = require('../models/tareaModel');

exports.crearTema = async (req, res) => {
  try {
    const { asignatura_id, nombre } = req.body;
    if (!asignatura_id || !nombre) {
      return res.status(400).json({ message: 'El ID de la asignatura y el nombre del tema son obligatorios.' });
    }

    const asignaturaExistente = await asignaturaModel.obtenerPorId(asignatura_id);
    if (!asignaturaExistente) {
      return res.status(404).json({ message: 'La asignatura especificada no existe.' });
    }

    const nuevoTemaId = await temaModel.crear({ asignatura_id, nombre });
    res.status(201).json({ message: 'Tema creado exitosamente', temaId: nuevoTemaId });
  } catch (error) {
    console.error("Error al crear tema:", error);
    res.status(500).json({ message: 'Error al crear tema', error: error.message });
  }
};

exports.obtenerTemas = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { asignaturaId, nombre, profesorId } = req.query;
    let resultado;

    if (nombre) {
      resultado = await temaModel.buscarPorNombrePaginado(nombre, page, limit);
    } else if (asignaturaId) {
      const asignaturaExistente = await asignaturaModel.obtenerPorId(asignaturaId);
      if (!asignaturaExistente) {
        return res.status(404).json({ message: 'Asignatura no encontrada' });
      }
      resultado = await temaModel.obtenerPorAsignaturaIdPaginado(asignaturaId, page, limit);
    } else if (profesorId) {
      resultado = await temaModel.obtenerPorProfesorIdPaginado(profesorId, page, limit);
    } else {
      resultado = await temaModel.obtenerTodosPaginado(page, limit);
    }
    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener temas:", error);
    res.status(500).json({ message: 'Error al obtener temas', error: error.message });
  }
};

exports.obtenerTemaPorId = async (req, res) => {
  try {
    const tema = await temaModel.obtenerPorId(req.params.id);
    if (!tema) {
        return res.status(404).json({ message: 'Tema no encontrado' });
    }
    res.json(tema);
  } catch (err) {
    console.error("Error al obtener tema por ID:", err);
    res.status(500).json({ message: 'Error al obtener tema', error: err.message });
  }
};

exports.actualizarTema = async (req, res) => {
  try {
    const { id } = req.params;
    const { asignatura_id, nombre } = req.body;

    if (asignatura_id) {
        const asignaturaExistente = await asignaturaModel.obtenerPorId(asignatura_id);
        if (!asignaturaExistente) {
            return res.status(404).json({ message: 'La asignatura especificada para actualizar no existe.' });
        }
    }

    const temaActualizado = await temaModel.actualizar(id, { asignatura_id, nombre });
    if (!temaActualizado) {
      return res.status(404).json({ message: 'Tema no encontrado o sin cambios necesarios' });
    }
    const temaModificado = await temaModel.obtenerPorId(id);
    res.json({ message: 'Tema actualizado exitosamente', tema: temaModificado });
  } catch (err) {
    console.error("Error al actualizar tema:", err);
    res.status(500).json({ message: 'Error al actualizar tema', error: err.message });
  }
};

exports.eliminarTema = async (req, res) => {
  try {
    const resultado = await temaModel.eliminar(req.params.id);
    if (!resultado) {
        return res.status(404).json({ message: 'Tema no encontrado' });
    }
    res.json({ message: 'Tema eliminado exitosamente' });
  } catch (err) {
    console.error("Error al eliminar tema:", err);
    if (err.message && err.message.includes('tareas asociadas')) {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al eliminar tema', error: err.message });
  }
};

exports.obtenerTareasPorTema = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Verificar que el tema existe
    const temaExistente = await temaModel.obtenerPorId(id);
    if (!temaExistente) {
      return res.status(404).json({ message: 'Tema no encontrado' });
    }

    // Obtener tareas paginadas
    const tareas = await tareaModel.obtenerPorTemaIdPaginado(id, page, limit);
    res.json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas por tema:", error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

exports.obtenerTemasPorAsignatura = async (req, res) => {
  try {
    const { asignaturaId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Verificar que la asignatura existe
    const asignaturaExistente = await asignaturaModel.obtenerPorId(asignaturaId);
    if (!asignaturaExistente) {
      return res.status(404).json({ message: 'Asignatura no encontrada' });
    }

    // Obtener temas paginados de la asignatura
    const temas = await temaModel.obtenerPorAsignaturaIdPaginado(asignaturaId, page, limit);
    res.json(temas);
  } catch (error) {
    console.error("Error al obtener temas por asignatura:", error);
    res.status(500).json({ message: 'Error al obtener temas', error: error.message });
  }
};