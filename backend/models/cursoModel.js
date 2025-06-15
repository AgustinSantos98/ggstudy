const db = require('../config/db');
const asignaturaModel = require('./asignaturaModel'); // Necesario para eliminar y obtener detalles
const temaModel = require('./temaModel'); // Necesario para obtener detalles

/**
 * Modelo para la entidad Curso
 * Proporciona métodos para realizar operaciones CRUD sobre la tabla curso
 */
const curso = {};

/**
 * Función auxiliar para ejecutar consultas que devuelven arrays
 * @param {string} sql - Consulta SQL a ejecutar
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise} - Promesa que resuelve a un array de resultados
 */
function queryArray(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error en consulta ARRAY:', err);
                return reject(err);
            }
            resolve(Array.isArray(results) ? results : []);
        });
    });
}

/**
 * Función auxiliar para ejecutar consultas que devuelven un único resultado
 * @param {string} sql - Consulta SQL a ejecutar
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise} - Promesa que resuelve a un único resultado o null
 */
function querySingle(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error en la consulta SINGLE:', err);
                return reject(err);
            }
            resolve(results[0] || null);
        });
    });
}

/**
 * Obtiene todos los cursos con paginación.
 * @param {number} page - Número de página.
 * @param {number} limit - Cantidad de registros por página.
 * @param {boolean} soloActivos - Parámetro mantenido por compatibilidad (ya no se utiliza).
 * @returns {Promise} - Promesa que resuelve a un objeto con los resultados y metadata.
 */
curso.obtenerTodosPaginado = (page = 1, limit = 10, soloActivos = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            let sql = 'SELECT * FROM curso';
            let countSql = 'SELECT COUNT(*) as total FROM curso';
            const params = [];

            // Parámetro soloActivos mantenido por compatibilidad pero ya no se utiliza
            // ya que la columna activo ya no existe en la tabla curso
            
            sql += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const results = await queryArray(sql, params);
            const countResult = await querySingle(countSql, soloActivos ? [] : []); // El count no necesita limit/offset
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    soloActivos
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene todos los cursos.
 * @param {boolean} soloActivos - Parámetro mantenido por compatibilidad (ya no se utiliza).
 * @returns {Promise} - Promesa que resuelve a un array de cursos.
 */
curso.obtenerTodos = (soloActivos = false) => {
    // Parámetro soloActivos mantenido por compatibilidad pero ya no se utiliza
    // ya que la columna activo ya no existe en la tabla curso
    let sql = 'SELECT * FROM curso';
    sql += ' ORDER BY nombre ASC';
    return queryArray(sql);
};

/**
 * Obtiene un curso por su ID.
 * @param {number} id - ID del curso.
 * @returns {Promise} - Promesa que resuelve a un curso o null.
 */
curso.obtenerPorId = (id) => {
    const sql = `SELECT * FROM curso WHERE id = ?`;
    return querySingle(sql, [id]);
};

/**
 * Obtiene un curso por su ID con detalles (asignaturas y temas).
 * @param {number} id - ID del curso.
 * @returns {Promise<Object|null>} - Promesa que resuelve al curso con sus detalles o null.
 */
curso.obtenerPorIdConDetalles = async (id) => {
    const cursoBase = await curso.obtenerPorId(id);
    if (!cursoBase) {
        return null;
    }

    const asignaturas = await asignaturaModel.obtenerPorCursoId(id, true); // Solo activas por defecto para visualización
    const asignaturasConTemas = [];

    for (const asig of asignaturas) {
        const temas = await temaModel.obtenerPorAsignaturaId(asig.id);
        let profesorInfo = null;
        if (asig.profesor_id) {
            const profesor = await querySingle('SELECT id, nombre, apellido, email FROM usuarios WHERE id = ? AND rol = \'profesor\' ', [asig.profesor_id]);
            if (profesor) {
                profesorInfo = profesor;
            }
        }
        asignaturasConTemas.push({ ...asig, profesor: profesorInfo, temas });
    }

    return { ...cursoBase, asignaturas: asignaturasConTemas };
};

/**
 * Crea un nuevo curso.
 * @param {Object} cursoData - Datos del curso ({ nombre, descripcion }).
 * @returns {Promise} - Promesa que resuelve al ID del curso creado.
 */
curso.crear = ({ nombre, descripcion = null }) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO curso (nombre, descripcion) VALUES (?, ?)`;
        db.query(sql, [nombre, descripcion], (err, result) => {
            if (err) {
                console.error('Error al crear el curso:', err);
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

/**
 * Actualiza un curso existente.
 * @param {number} id - ID del curso a actualizar.
 * @param {Object} cursoData - Datos actualizados ({ nombre, descripcion }).
 * @returns {Promise} - Promesa que resuelve a true si se actualizó.
 */
curso.actualizar = (id, { nombre, descripcion }) => {
    return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];
        if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
        if (descripcion !== undefined) { fields.push('descripcion = ?'); values.push(descripcion); }

        if (fields.length === 0) {
            return resolve(true); // No hay nada que actualizar
        }
        values.push(id);
        const sql = `UPDATE curso SET ${fields.join(', ')} WHERE id = ?`;
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error al actualizar el curso:', err);
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Elimina un curso.
 * @param {number} id - ID del curso a eliminar.
 * @returns {Promise} - Promesa que resuelve a true si se eliminó.
 */
curso.eliminar = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Verificar si hay asignaturas asociadas al curso
            const asignaturas = await asignaturaModel.obtenerPorCursoId(id);
            if (asignaturas && asignaturas.length > 0) {
                return reject(new Error('No se puede eliminar el curso porque tiene asignaturas asociadas.'));
            }
            // También verificar si hay alumnos matriculados (tabla curso_usuario)
            const alumnosMatriculados = await curso.obtenerAlumnosPorCursoPaginado(id, 1, 1);
            if (alumnosMatriculados && alumnosMatriculados.pagination.total > 0) {
                 return reject(new Error('No se puede eliminar el curso porque tiene alumnos matriculados. Desmatricúlelos primero.'));
            }

            const sql = `DELETE FROM curso WHERE id = ?`;
            db.query(sql, [id], (err, result) => {
                if (err) {
                    console.error('Error al eliminar el curso:', err);
                    return reject(err);
                }
                resolve(result.affectedRows > 0);
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Matricula un alumno en un curso.
 * @param {number} cursoId - ID del curso.
 * @param {number} alumnoId - ID del alumno (usuario_id).
 * @returns {Promise<number>} - ID de la nueva matricula.
 */
curso.matricularAlumno = (cursoId, alumnoId) => {
    return new Promise((resolve, reject) => {
        // Verificar si ya existe la matrícula
        const checkSql = 'SELECT id FROM curso_usuario WHERE curso_id = ? AND usuario_id = ?';
        db.query(checkSql, [cursoId, alumnoId], (errCheck, resultsCheck) => {
            if (errCheck) {
                return reject(errCheck);
            }
            if (resultsCheck.length > 0) {
                return reject(new Error('El alumno ya está matriculado en este curso.'));
            }

            const insertSql = 'INSERT INTO curso_usuario (curso_id, usuario_id) VALUES (?, ?)';
            db.query(insertSql, [cursoId, alumnoId], (errInsert, resultInsert) => {
                if (errInsert) {
                    console.error('Error al matricular alumno en curso:', errInsert);
                    return reject(errInsert);
                }
                resolve(resultInsert.insertId);
            });
        });
    });
};

/**
 * Desmatricula un alumno de un curso.
 * @param {number} cursoId - ID del curso.
 * @param {number} alumnoId - ID del alumno (usuario_id).
 * @returns {Promise<boolean>} - True si se desmatriculó.
 */
curso.desmatricularAlumno = (cursoId, alumnoId) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM curso_usuario WHERE curso_id = ? AND usuario_id = ?';
        db.query(sql, [cursoId, alumnoId], (err, result) => {
            if (err) {
                console.error('Error al desmatricular alumno:', err);
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Obtiene todos los alumnos matriculados en un curso con paginación.
 * @param {number} cursoId - ID del curso.
 * @param {number} page - Número de página.
 * @param {number} limit - Cantidad de registros por página.
 * @returns {Promise<Object>} - Objeto con datos y paginación.
 */
curso.obtenerAlumnosPorCursoPaginado = (cursoId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const sql = `
                SELECT u.id, u.dni, u.nombre, u.apellido, u.email, u.foto_perfil_url
                FROM usuarios u
                INNER JOIN curso_usuario cu ON u.id = cu.usuario_id
                WHERE cu.curso_id = ? AND u.rol = 'alumno'
                ORDER BY u.apellido, u.nombre
                LIMIT ? OFFSET ?
            `;
            const countSql = `SELECT COUNT(*) as total 
                              FROM usuarios u 
                              INNER JOIN curso_usuario cu ON u.id = cu.usuario_id 
                              WHERE cu.curso_id = ? AND u.rol = 'alumno'`;
            
            const results = await queryArray(sql, [cursoId, limit, offset]);
            const countResult = await querySingle(countSql, [cursoId]);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    cursoId
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene todos los cursos en los que un alumno está matriculado, con paginación.
 * @param {number} alumnoId - ID del alumno (usuario_id).
 * @param {number} page - Número de página.
 * @param {number} limit - Cantidad de registros por página.
 * @returns {Promise<Object>} - Objeto con datos y paginación.
 */
curso.obtenerCursosPorAlumnoIdPaginado = (alumnoId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const sql = `
                SELECT c.id, c.nombre, c.descripcion
                FROM curso c
                INNER JOIN curso_usuario cu ON c.id = cu.curso_id
                WHERE cu.usuario_id = ?
                ORDER BY c.nombre ASC
                LIMIT ? OFFSET ?
            `;
            const countSql = `SELECT COUNT(*) as total 
                              FROM curso c 
                              INNER JOIN curso_usuario cu ON c.id = cu.curso_id 
                              WHERE cu.usuario_id = ?`;
            
            const results = await queryArray(sql, [alumnoId, limit, offset]);
            const countResult = await querySingle(countSql, [alumnoId]);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    alumnoId
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene cursos por su nombre
 * @param {string} nombre - Nombre a buscar
 * @returns {Promise} - Promesa que resuelve a un array de cursos
 */
curso.obtenerPorNombre = (nombre) => {
    const sql = `
        SELECT *
        FROM curso
        WHERE nombre LIKE ?
    `;
    return queryArray(sql, [`%${nombre}%`]);
};

/**
 * Obtiene todos los cursos creados por un usuario específico
 * @param {number} usuarioId - ID del usuario creador
 * @returns {Promise} - Promesa que resuelve a un array de cursos
 */
curso.obtenerPorUsuarioId = (usuarioId) => {
    const sql = `SELECT * FROM curso WHERE usuario_id = ?`;
    return queryArray(sql, [usuarioId]);
};

/**
 * Obtiene los temas asociados a un curso
 * @param {number} cursoId - ID del curso
 * @returns {Promise} - Promesa que resuelve a un array de temas
 */
curso.obtenerTemasPorCurso = (cursoId) => {
    const sql = `
        SELECT t.*
        FROM tema t
        WHERE t.curso_id = ?
    `;
    return queryArray(sql, [cursoId]);
};

/**
 * Busca cursos por un término (nombre o descripción)
 * @param {string} termino - Término de búsqueda
 * @param {number} limit - Cantidad de resultados a devolver
 * @returns {Promise} - Promesa que resuelve a un array de cursos
 */
curso.buscar = (termino, limit = 10) => {
    const sql = `
        SELECT *
        FROM curso
        WHERE nombre LIKE ? OR descripcion LIKE ?
        LIMIT ?
    `;
    const searchTerm = `%${termino}%`;
    return queryArray(sql, [searchTerm, searchTerm, limit]);
};

/**
 * Obtiene la relación entre un curso y un profesor
 * @param {number} cursoId - ID del curso
 * @param {number} profesorId - ID del profesor
 * @returns {Promise} - Promesa que resuelve a la relación o null
 */
curso.obtenerRelacionCursoProfesor = (cursoId, profesorId) => {
    const sql = `SELECT * FROM curso_profesor WHERE curso_id = ? AND usuario_id = ?`;
    return querySingle(sql, [cursoId, profesorId]);
};

/**
 * Obtiene la relación entre un curso y un alumno
 * @param {number} cursoId - ID del curso
 * @param {number} alumnoId - ID del alumno
 * @returns {Promise} - Promesa que resuelve a la relación o null
 */
curso.obtenerRelacionCursoAlumno = (cursoId, alumnoId) => {
    const sql = `SELECT * FROM curso_usuario WHERE curso_id = ? AND usuario_id = ?`;
    return querySingle(sql, [cursoId, alumnoId]);
};

/**
 * Obtiene un curso con detalles (profesores, alumnos, temas)
 * @param {number} cursoId - ID del curso
 * @returns {Promise} - Promesa que resuelve a un objeto con el curso y sus detalles
 */
curso.obtenerCursoConDetalles = async (cursoId) => {
    try {
        const cursoInfo = await curso.obtenerPorId(cursoId);
        if (!cursoInfo) {
            return null; // O manejar como error
        }

        const profesores = await curso.obtenerProfesoresPorCurso(cursoId);
        const alumnos = await curso.obtenerAlumnosPorCurso(cursoId); // Asumiendo que esta función devuelve solo alumnos
        const temas = await curso.obtenerTemasPorCurso(cursoId);

        return {
            ...cursoInfo,
            profesores,
            alumnos,
            temas
        };
    } catch (error) {
        console.error('Error al obtener curso con detalles:', error);
        throw error;
    }
};

/**
 * Cuenta la cantidad de alumnos en un curso
 * @param {number} cursoId - ID del curso
 * @returns {Promise} - Promesa que resuelve al número de alumnos
 */
curso.contarAlumnosEnCurso = (cursoId) => {
    const sql = `SELECT COUNT(*) as totalAlumnos FROM curso_usuario WHERE curso_id = ?`;
    return querySingle(sql, [cursoId]).then(result => result ? result.totalAlumnos : 0);
};

/**
 * Cuenta la cantidad de profesores en un curso
 * @param {number} cursoId - ID del curso
 * @returns {Promise} - Promesa que resuelve al número de profesores
 */
curso.contarProfesoresEnCurso = (cursoId) => {
    const sql = `SELECT COUNT(*) as totalProfesores FROM curso_profesor WHERE curso_id = ?`;
    return querySingle(sql, [cursoId]).then(result => result ? result.totalProfesores : 0);
};

/**
 * Cuenta la cantidad de temas en un curso
 * @param {number} cursoId - ID del curso
 * @returns {Promise} - Promesa que resuelve al número de temas
 */
curso.contarTemasEnCurso = (cursoId) => {
    const sql = `SELECT COUNT(*) as totalTemas FROM tema WHERE curso_id = ?`;
    return querySingle(sql, [cursoId]).then(result => result ? result.totalTemas : 0);
};

module.exports = curso; 