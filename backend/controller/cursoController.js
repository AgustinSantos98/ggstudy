const cursoModel = require('../models/cursoModel');
// const cursoProfesorModel = require('../models/cursoProfesorModel'); // Eliminado
const userModel = require('../models/usuarioModel');
const asignaturaModel = require('../models/asignaturaModel'); // Añadido para obtener profesores

/**
 * Controlador para gestionar operaciones relacionadas con cursos
 */

/**
 * Obtiene todos los cursos con paginación
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerTodosLosCursos = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const soloActivos = req.query.activos === 'true'; // Para filtrar por cursos activos
        const { data, pagination } = await cursoModel.obtenerTodosPaginado(page, limit, soloActivos);
        res.json({ data, pagination });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cursos', error: error.message });
    }
};

/**
 * Obtiene un curso por su ID
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerCursoPorId = async (req, res) => {
    try {
        const curso = await cursoModel.obtenerPorIdConDetalles(req.params.id);
        if (!curso) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }
        res.json(curso);
    } catch (error) {
        console.error('Error al obtener curso por ID:', error);
        res.status(500).json({ message: 'Error del servidor al obtener curso por ID', error: error.message });
    }
};

/**
 * Crea un nuevo curso
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.crearCurso = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre) {
            return res.status(400).json({ message: 'El nombre del curso es obligatorio.' });
        }
        const nuevoCursoId = await cursoModel.crear({ nombre, descripcion });
        res.status(201).json({ message: 'Curso creado exitosamente', cursoId: nuevoCursoId });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear curso', error: error.message });
    }
};

/**
 * Actualiza un curso existente
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.actualizarCurso = async (req, res) => {
    try {
        const cursoActualizado = await cursoModel.actualizar(req.params.id, req.body);
        if (!cursoActualizado) {
            return res.status(404).json({ message: 'Curso no encontrado o sin cambios necesarios' });
        }
        res.json({ message: 'Curso actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar curso:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar curso', error: error.message });
    }
};

/**
 * Elimina un curso
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.eliminarCurso = async (req, res) => {
    try {
        const resultado = await cursoModel.eliminar(req.params.id);
        if (!resultado) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }
        res.json({ message: 'Curso eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar curso:', error);
        // Manejar error de FK si el curso tiene asignaturas asociadas
        if (error.message.includes('asignaturas asociadas')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar curso', error: error.message });
    }
};

/**
 * Obtiene todos los profesores asociados a las asignaturas de un curso específico.
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerProfesoresPorCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const curso = await cursoModel.obtenerPorId(cursoId); // Verificar si el curso existe
        if (!curso) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }

        const asignaturasDelCurso = await asignaturaModel.obtenerPorCursoId(cursoId);
        if (!asignaturasDelCurso || asignaturasDelCurso.length === 0) {
            return res.json([]); // No hay asignaturas, por lo tanto no hay profesores
        }

        const profesorIds = [...new Set(asignaturasDelCurso.map(asig => asig.profesor_id).filter(id => id !== null))];

        if (profesorIds.length === 0) {
            return res.json([]); // No hay profesores asignados a las asignaturas de este curso
        }

        // Obtener detalles de los profesores
        // Esta es una forma simple, podría optimizarse si userModel.obtenerMuchosPorId existiera
        const profesores = [];
        for (const profesorId of profesorIds) {
            const profesor = await userModel.obtenerPorId(profesorId);
            if (profesor && profesor.rol === 'profesor') {
                // No devolver la contraseña
                const { contrasena, ...profesorSinContrasena } = profesor;
                profesores.push(profesorSinContrasena);
            }
        }
        
        res.json(profesores);
    } catch (error) {
        console.error('Error al obtener profesores del curso:', error);
        res.status(500).json({ message: 'Error del servidor al obtener profesores del curso', error: error.message });
    }
};

/**
 * Obtiene todos los alumnos matriculados en un curso con paginación
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerAlumnosPorCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const curso = await cursoModel.obtenerPorId(cursoId); // Verificar si el curso existe
        if (!curso) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }

        const { data, pagination } = await cursoModel.obtenerAlumnosPorCursoPaginado(cursoId, page, limit);
        res.json({ data, pagination });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener alumnos del curso', error: error.message });
    }
};

/**
 * Matricula a un alumno en un curso
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.matricularAlumnoEnCurso = async (req, res) => {
    try {
        const { cursoId } = req.params; 
        const { usuario_id } = req.body;

        if (!usuario_id) {
            return res.status(400).json({ message: 'El ID del usuario es obligatorio.' });
        }

        // Verificar que el curso existe
        const curso = await cursoModel.obtenerPorId(cursoId);
        if (!curso) {
            return res.status(404).json({ message: 'Curso no encontrado.' });
        }

        // Verificar que el usuario existe y es un alumno
        const alumno = await userModel.obtenerPorId(usuario_id);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado.' });
        }
        if (alumno.rol !== 'alumno') {
            return res.status(400).json({ message: 'El usuario especificado no es un alumno.' });
        }

        const resultado = await cursoModel.matricularAlumno(cursoId, usuario_id);
        res.status(201).json({ message: 'Alumno matriculado exitosamente en el curso', data: resultado });
    } catch (error) {
        // Manejar error si el alumno ya está matriculado (depende de cómo lo maneje el modelo)
        if (error.message.includes('ya matriculado')) { // Suponiendo que el modelo lanza un error específico
            return res.status(409).json({ message: error.message }); 
        }
        console.error('Error al matricular alumno:', error);
        res.status(500).json({ message: 'Error del servidor al matricular alumno', error: error.message });
    }
};

/**
 * Desmatricula a un alumno de un curso
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.desmatricularAlumnoDeCurso = async (req, res) => {
    try {
        const { cursoId, alumnoId } = req.params;
        const resultado = await cursoModel.desmatricularAlumno(cursoId, alumnoId);
        if (!resultado) {
            return res.status(404).json({ message: 'Matrícula no encontrada o alumno no estaba en el curso' });
        }
        res.json({ message: 'Alumno desmatriculado del curso exitosamente' });
    } catch (error) {
        console.error('Error al desmatricular alumno:', error);
        res.status(500).json({ message: 'Error del servidor al desmatricular alumno', error: error.message });
    }
};

/**
 * Obtener todas las asignaturas de un curso con paginación
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerAsignaturasPorCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const soloActivas = req.query.activas === 'true';

        // Verificar si el curso existe
        const curso = await cursoModel.obtenerPorId(cursoId);
        if (!curso) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }

        const resultado = await asignaturaModel.obtenerPorCursoIdPaginado(cursoId, page, limit, soloActivas);
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener asignaturas del curso:', error);
        res.status(500).json({ message: 'Error del servidor al obtener asignaturas del curso', error: error.message });
    }
};

/**
 * Obtener detalles completos de un curso (info, alumnos, profesores, temas)
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerCursoConDetalles = async (req, res) => {
    try {
        const cursoDetalles = await cursoModel.obtenerCursoConDetalles(req.params.id);
        if (!cursoDetalles) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }
        res.json(cursoDetalles);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener detalles del curso', error: error.message });
    }
};

/**
 * Obtener cursos por profesor con paginación
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerCursosPorProfesor = async (req, res) => {
    try {
        const profesorId = req.params.profesorId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { data, pagination } = await cursoModel.obtenerCursosPorProfesorPaginado(profesorId, page, limit);
        res.json({ data, pagination });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cursos del profesor', error: error.message });
    }
};

/**
 * Obtener cursos por alumno con paginación
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerCursosPorAlumno = async (req, res) => {
    try {
        const { alumnoId } = req.params;
        const { page = 1, limit = 10 } = req.pagination || {}; // Asignar valores por defecto

        // Verificar que el alumno existe
        const alumno = await userModel.obtenerPorId(alumnoId);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        
        // Verificar que el usuario es un alumno
        if (alumno.rol !== 'alumno') {
            return res.status(400).json({ message: 'El usuario especificado no es un alumno' });
        }
        
        const resultado = await cursoModel.obtenerCursosPorAlumnoIdPaginado(alumnoId, page, limit);
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener cursos por alumno:', error);
        res.status(500).json({ message: 'Error al obtener los cursos del alumno', error: error.message });
    }
};

/**
 * Obtener cursos disponibles para matricular a un alumno
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerCursosDisponibles = async (req, res) => {
    try {
        const { alumnoId } = req.params;
        const { page = 1, limit = 10 } = req.pagination || {}; // Asignar valores por defecto

        // Verificar que el alumno existe
        const alumno = await userModel.obtenerPorId(alumnoId);
        if (!alumno) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        
        // Verificar que el usuario es un alumno
        if (alumno.rol !== 'alumno') {
            return res.status(400).json({ message: 'El usuario especificado no es un alumno' });
        }
        
        // Obtener todos los cursos y filtrar los que el alumno ya está matriculado
        const cursosMatriculados = await cursoModel.obtenerCursosPorAlumnoIdPaginado(alumnoId, 1, 1000);
        const idsCursosMatriculados = cursosMatriculados.data.map(curso => curso.id);
        
        // Obtener todos los cursos (sin paginación para filtrar correctamente)
        const todosCursos = await cursoModel.obtenerTodos();
        
        // Filtrar los cursos en los que el alumno no está matriculado
        const cursosDisponibles = todosCursos.filter(curso => 
            !idsCursosMatriculados.includes(curso.id)
        );
        
        // Aplicar paginación manualmente
        const offset = (page - 1) * limit;
        const cursosPaginados = cursosDisponibles.slice(offset, offset + limit);
        
        // Construir la respuesta paginada
        const respuesta = {
            data: cursosPaginados,
            pagination: {
                page: page,
                limit: limit,
                total: cursosDisponibles.length,
                totalPages: Math.ceil(cursosDisponibles.length / limit)
            }
        };
        
        res.json(respuesta);
    } catch (error) {
        console.error('Error al obtener cursos disponibles:', error);
        res.status(500).json({ message: 'Error al obtener los cursos disponibles para el alumno', error: error.message });
    }
};

/**
 * Buscar cursos por término
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.buscarCursos = async (req, res) => {
    try {
        const termino = req.query.term;
        const limit = parseInt(req.query.limit, 10) || 10;
        if (!termino) {
            return res.status(400).json({ message: 'Término de búsqueda requerido' });
        }
        const cursos = await cursoModel.buscar(termino, limit);
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar cursos', error: error.message });
    }
};

 