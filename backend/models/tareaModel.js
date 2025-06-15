const db = require('../config/db');

/**
 * Modelo para la entidad Tarea
 * Proporciona métodos para realizar operaciones CRUD sobre la tabla tarea
 */
const tarea = {};

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
 * Obtiene todas las tareas con paginación
 * @param {number} page - Número de página (comienza en 1)
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con los resultados y metadata
 */
tarea.obtenerTodosPaginado = (page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            
            const sql = `
                SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
                       tarea.visible, tarea.archivo, tarea.creado_por,
                       tema.nombre AS tema_nombre,
                       asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
                       cur.id AS curso_id, cur.nombre AS curso_nombre,
                       u.nombre AS creador_nombre, u.apellido AS creador_apellido
                FROM tarea
                INNER JOIN tema ON tarea.tema_id = tema.id
                INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
                INNER JOIN curso cur ON asig.curso_id = cur.id
                LEFT JOIN usuarios u ON tarea.creado_por = u.id
                ORDER BY tarea.id DESC
                LIMIT ? OFFSET ?
            `;
            
            const countSql = `SELECT COUNT(*) as total FROM tarea`;
            
            const results = await queryArray(sql, [limit, offset]);
            const countResult = await querySingle(countSql);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene todas las tareas
 * @returns {Promise} - Promesa que resuelve a un array de tareas
 */
tarea.obtenerTodos = () => {
    const sql = `
        SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
               tarea.visible, tarea.archivo, tarea.creado_por,
               tema.nombre AS tema_nombre,
               asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
               cur.id AS curso_id, cur.nombre AS curso_nombre,
               u.nombre AS creador_nombre, u.apellido AS creador_apellido
        FROM tarea
        INNER JOIN tema ON tarea.tema_id = tema.id
        INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
        INNER JOIN curso cur ON asig.curso_id = cur.id
        LEFT JOIN usuarios u ON tarea.creado_por = u.id
        ORDER BY tarea.id DESC
    `;
    return queryArray(sql);
};

/**
 * Obtiene una tarea por su ID
 * @param {number} id - ID de la tarea
 * @returns {Promise} - Promesa que resuelve a una tarea o null
 */
tarea.obtenerPorId = (id) => {
    const sql = `
        SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
               tarea.visible, tarea.archivo, tarea.creado_por,
               tema.nombre AS tema_nombre,
               asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
               cur.id AS curso_id, cur.nombre AS curso_nombre,
               u.nombre AS creador_nombre, u.apellido AS creador_apellido
        FROM tarea
        INNER JOIN tema ON tarea.tema_id = tema.id
        INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
        INNER JOIN curso cur ON asig.curso_id = cur.id
        LEFT JOIN usuarios u ON tarea.creado_por = u.id
        WHERE tarea.id = ?
    `;
    return querySingle(sql, [id]);
};

/**
 * Obtiene todas las tareas asociadas a un tema específico con paginación
 * @param {number} temaId - ID del tema
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de registros por página
 * @param {boolean} soloVisibles - Para filtrar solo tareas visibles (opcional)
 * @returns {Promise} - Promesa que resuelve a un objeto con tareas y metadata
 */
tarea.obtenerPorTemaIdPaginado = (temaId, page = 1, limit = 10, soloVisibles = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            let queryParams = [temaId, limit, offset];
            let whereClause = "WHERE tarea.tema_id = ?";

            if (soloVisibles) {
                whereClause += " AND tarea.visible = TRUE";
            }
            
            const sql = `
                SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
                       tarea.visible, tarea.archivo, tarea.creado_por,
                       tema.nombre AS tema_nombre,
                       asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
                       cur.id AS curso_id, cur.nombre AS curso_nombre,
                       u.nombre AS creador_nombre, u.apellido AS creador_apellido
                FROM tarea
                INNER JOIN tema ON tarea.tema_id = tema.id
                INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
                INNER JOIN curso cur ON asig.curso_id = cur.id
                LEFT JOIN usuarios u ON tarea.creado_por = u.id
                ${whereClause}
                ORDER BY tarea.fecha_entrega DESC, tarea.id DESC
                LIMIT ? OFFSET ?
            `;
            
            let countSql = `SELECT COUNT(*) as total FROM tarea ${whereClause.replace("tarea.tema_id = ?", "tema_id = ?")}`;
            let countParams = [temaId];
            if (soloVisibles) {
                // No es necesario añadir TRUE a countParams si whereClause ya lo tiene para el COUNT
            }

            const results = await queryArray(sql, queryParams);
            const countResult = await querySingle(countSql, countParams);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    temaId,
                    soloVisibles
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene todas las tareas asociadas a un tema específico
 * @param {number} temaId - ID del tema
 * @param {boolean} soloVisibles - Para filtrar solo tareas visibles (opcional)
 * @returns {Promise} - Promesa que resuelve a un array de tareas
 */
tarea.obtenerPorTemaId = (temaId, soloVisibles = false) => {
    let whereClause = "WHERE tarea.tema_id = ?";
    const queryParams = [temaId];

    if (soloVisibles) {
        whereClause += " AND tarea.visible = TRUE";
    }
    const sql = `
        SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
               tarea.visible, tarea.archivo, tarea.creado_por,
               tema.nombre AS tema_nombre,
               asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
               cur.id AS curso_id, cur.nombre AS curso_nombre,
               u.nombre AS creador_nombre, u.apellido AS creador_apellido
        FROM tarea
        INNER JOIN tema ON tarea.tema_id = tema.id
        INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
        INNER JOIN curso cur ON asig.curso_id = cur.id
        LEFT JOIN usuarios u ON tarea.creado_por = u.id
        ${whereClause}
        ORDER BY tarea.fecha_entrega DESC, tarea.id DESC
    `;
    return queryArray(sql, queryParams);
};

/**
 * Crea una nueva tarea
 * @param {Object} tareaData - Datos de la tarea a crear
 * @returns {Promise} - Promesa que resuelve al ID de la tarea creada
 */
tarea.crear = ({ tema_id, titulo, descripcion, fecha_entrega, visible = true, archivo = null, creado_por }) => {
    return new Promise((resolve, reject) => {
        // Validar que creado_por (usuario_id) existe y tiene rol profesor o admin si es necesario aquí o en el controlador
        
        // Formatear la fecha_entrega para MySQL
        let fechaFormateada;
        try {
            const fecha = new Date(fecha_entrega);
            if (isNaN(fecha.getTime())) {
                throw new Error('Fecha de entrega inválida');
            }
            // Formato YYYY-MM-DD HH:MM:SS
            fechaFormateada = fecha.toISOString().slice(0, 19).replace('T', ' ');
        } catch (error) {
            console.error('Error al formatear la fecha de entrega:', error);
            return reject(new Error('Formato de fecha de entrega incorrecto. Use un formato ISO 8601 válido (ej: YYYY-MM-DDTHH:MM:SSZ)'));
        }

        const sql = `
            INSERT INTO tarea (tema_id, titulo, descripcion, fecha_entrega, visible, archivo, creado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [tema_id, titulo, descripcion, fechaFormateada, visible, archivo, creado_por], (err, result) => {
            if (err) {
                console.error('Error al crear la tarea:', err);
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

/**
 * Actualiza una tarea existente
 * @param {number} id - ID de la tarea a actualizar
 * @param {Object} tareaData - Datos actualizados de la tarea
 * @returns {Promise} - Promesa que resuelve a true si se actualizó correctamente
 */
tarea.actualizar = (id, { tema_id, titulo, descripcion, fecha_entrega, visible, archivo, creado_por }) => {
    return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];

        if (tema_id !== undefined) { fields.push('tema_id = ?'); values.push(tema_id); }
        if (titulo !== undefined) { fields.push('titulo = ?'); values.push(titulo); }
        if (descripcion !== undefined) { fields.push('descripcion = ?'); values.push(descripcion); }
        if (fecha_entrega !== undefined) { fields.push('fecha_entrega = ?'); values.push(fecha_entrega); }
        if (visible !== undefined) { fields.push('visible = ?'); values.push(visible); }
        if (archivo !== undefined) { fields.push('archivo = ?'); values.push(archivo); }
        // Creado_por generalmente no se actualiza, pero se incluye por si acaso.
        if (creado_por !== undefined) { fields.push('creado_por = ?'); values.push(creado_por); }

        if (fields.length === 0) {
            return resolve(true); // No hay nada que actualizar
        }
        values.push(id);
        const sql = `UPDATE tarea SET ${fields.join(', ')} WHERE id = ?`;
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error al actualizar la tarea:', err);
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Elimina una tarea
 * @param {number} id - ID de la tarea a eliminar
 * @returns {Promise} - Promesa que resuelve a true si se eliminó correctamente
 */
tarea.eliminar = (id) => {
    return new Promise((resolve, reject) => {
        // Antes de eliminar, verificar si hay calificaciones asociadas
        const checkCalificacionesSql = 'SELECT COUNT(*) as total FROM tarea_calificacion WHERE tarea_id = ?';
        db.query(checkCalificacionesSql, [id], (err, checkResult) => {
            if (err) {
                console.error('Error al verificar calificaciones:', err);
                return reject(err);
            }
            if (checkResult[0].total > 0) {
                return reject(new Error('No se puede eliminar la tarea porque tiene calificaciones asociadas.'));
            }

            const sql = `DELETE FROM tarea WHERE id = ?`;
            db.query(sql, [id], (deleteErr, result) => {
                if (deleteErr) {
                    console.error('Error al eliminar la tarea:', deleteErr);
                    return reject(deleteErr);
                }
                resolve(result.affectedRows > 0);
            });
        });
    });
};

/**
 * Obtiene todas las tareas creadas por un profesor/admin específico con paginación
 * @param {number} usuarioId - ID del usuario (profesor o admin)
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con tareas y metadata
 */
tarea.obtenerPorCreadorIdPaginado = (usuarioId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            
            const sql = `
                SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
                       tarea.visible, tarea.archivo, tarea.creado_por,
                       tema.nombre AS tema_nombre,
                       asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
                       cur.id AS curso_id, cur.nombre AS curso_nombre,
                       u.nombre AS creador_nombre, u.apellido AS creador_apellido
                FROM tarea
                INNER JOIN tema ON tarea.tema_id = tema.id
                INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
                INNER JOIN curso cur ON asig.curso_id = cur.id
                LEFT JOIN usuarios u ON tarea.creado_por = u.id
                WHERE tarea.creado_por = ?
                ORDER BY tarea.fecha_creacion DESC, tarea.id DESC
                LIMIT ? OFFSET ?
            `;
            
            const countSql = `SELECT COUNT(*) as total FROM tarea WHERE creado_por = ?`;
            
            const results = await queryArray(sql, [usuarioId, limit, offset]);
            const countResult = await querySingle(countSql, [usuarioId]);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    creadorId: usuarioId
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Busca tareas por título con paginación, incluyendo información contextual.
 * @param {string} titulo - Título a buscar.
 * @param {number} page - Número de página.
 * @param {number} limit - Límite de resultados.
 * @returns {Promise} - Promesa que resuelve a un objeto con tareas y metadata.
 */
tarea.buscarPorTituloPaginado = (titulo, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const searchTerm = `%${titulo}%`;
            const sql = `
                SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
                       tarea.visible, tarea.archivo, tarea.creado_por,
                       tema.nombre AS tema_nombre,
                       asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
                       cur.id AS curso_id, cur.nombre AS curso_nombre,
                       u.nombre AS creador_nombre, u.apellido AS creador_apellido
                FROM tarea
                INNER JOIN tema ON tarea.tema_id = tema.id
                INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
                INNER JOIN curso cur ON asig.curso_id = cur.id
                LEFT JOIN usuarios u ON tarea.creado_por = u.id
                WHERE tarea.titulo LIKE ?
                ORDER BY tarea.id DESC
                LIMIT ? OFFSET ?
            `;
            const countSql = `SELECT COUNT(*) as total FROM tarea WHERE titulo LIKE ?`;
            
            const results = await queryArray(sql, [searchTerm, limit, offset]);
            const countResult = await querySingle(countSql, [searchTerm]);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    query: titulo
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene todas las tareas asociadas a las asignaturas de un profesor específico con paginación
 * @param {number} profesorId - ID del profesor
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de registros por página
 * @param {boolean} soloVisibles - Para filtrar solo tareas visibles (opcional)
 * @returns {Promise} - Promesa que resuelve a un objeto con tareas y metadata
 */
tarea.obtenerPorProfesorIdPaginado = (profesorId, page = 1, limit = 10, soloVisibles = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            
            // Construir la condición de visibilidad
            const visibilidadCondicion = soloVisibles ? 'AND tarea.visible = 1' : '';
            
            const sql = `
                SELECT tarea.id, tarea.tema_id, tarea.titulo, tarea.descripcion, tarea.fecha_entrega,
                       tarea.visible, tarea.archivo, tarea.creado_por,
                       tema.nombre AS tema_nombre,
                       asig.id AS asignatura_id, asig.nombre AS asignatura_nombre,
                       cur.id AS curso_id, cur.nombre AS curso_nombre,
                       u.nombre AS creador_nombre, u.apellido AS creador_apellido
                FROM tarea
                INNER JOIN tema ON tarea.tema_id = tema.id
                INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
                INNER JOIN curso cur ON asig.curso_id = cur.id
                LEFT JOIN usuarios u ON tarea.creado_por = u.id
                WHERE asig.profesor_id = ? ${visibilidadCondicion}
                ORDER BY tarea.id DESC
                LIMIT ? OFFSET ?
            `;
            
            const countSql = `
                SELECT COUNT(*) as total 
                FROM tarea
                INNER JOIN tema ON tarea.tema_id = tema.id
                INNER JOIN asignatura asig ON tema.asignatura_id = asig.id
                WHERE asig.profesor_id = ? ${visibilidadCondicion}
            `;
            
            const results = await queryArray(sql, [profesorId, limit, offset]);
            const countResult = await querySingle(countSql, [profesorId]);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Verifica si un alumno tiene acceso a un tema (está matriculado en el curso al que pertenece la asignatura del tema)
 * @param {number} alumnoId - ID del alumno
 * @param {number} temaId - ID del tema
 * @returns {Promise<boolean>} - Promesa que resuelve a true si el alumno tiene acceso, false en caso contrario
 */
tarea.verificarAccesoAlumnoATema = async (alumnoId, temaId) => {
    try {
        const sql = `
            SELECT COUNT(*) as acceso
            FROM curso_usuario ca
            JOIN asignatura a ON a.curso_id = ca.curso_id
            JOIN tema t ON t.asignatura_id = a.id
            WHERE ca.usuario_id = ? AND t.id = ?
        `;
        
        const result = await querySingle(sql, [alumnoId, temaId]);
        return result && result.acceso > 0;
    } catch (error) {
        console.error('Error al verificar acceso del alumno al tema:', error);
        throw error;
    }
};

/**
 * Obtiene todas las tareas de un tema específico con paginación
 * @param {number} temaId - ID del tema
 * @param {boolean} soloVisibles - Si es true, solo devuelve tareas visibles
 * @param {number} limit - Cantidad de registros por página
 * @param {number} offset - Desplazamiento para la paginación
 * @returns {Promise<Array>} - Promesa que resuelve a un array de tareas
 */
tarea.obtenerPorTema = async (temaId, soloVisibles = false, limit = 10, offset = 0) => {
    try {
        let sql = `
            SELECT t.*, 
                   tema.nombre as tema_nombre,
                   a.nombre as asignatura_nombre,
                   a.id as asignatura_id,
                   c.id as curso_id,
                   c.nombre as curso_nombre,
                   u.nombre as creador_nombre,
                   u.apellido as creador_apellido
            FROM tarea t
            JOIN tema ON t.tema_id = tema.id
            JOIN asignatura a ON tema.asignatura_id = a.id
            JOIN curso c ON a.curso_id = c.id
            LEFT JOIN usuarios u ON t.creado_por = u.id
            WHERE t.tema_id = ?
        `;
        
        const params = [temaId];
        
        if (soloVisibles) {
            sql += ' AND t.visible = true';
        }
        
        sql += ' ORDER BY t.fecha_entrega ASC';
        
        if (limit > 0) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }
        
        return await queryArray(sql, params);
    } catch (error) {
        console.error('Error al obtener tareas por tema:', error);
        throw error;
    }
};

/**
 * Cuenta el número total de tareas en un tema
 * @param {number} temaId - ID del tema
 * @param {boolean} soloVisibles - Si es true, solo cuenta tareas visibles
 * @returns {Promise<number>} - Promesa que resuelve al número total de tareas
 */
tarea.contarPorTema = async (temaId, soloVisibles = false) => {
    try {
        let sql = 'SELECT COUNT(*) as total FROM tarea WHERE tema_id = ?';
        const params = [temaId];
        
        if (soloVisibles) {
            sql += ' AND visible = true';
        }
        
        const result = await querySingle(sql, params);
        return result ? result.total : 0;
    } catch (error) {
        console.error('Error al contar tareas por tema:', error);
        throw error;
    }
};

/**
 * Obtiene las entregas de un alumno para un conjunto de tareas
 * @param {number} alumnoId - ID del alumno
 * @param {Array<number>} tareaIds - Array de IDs de tareas
 * @returns {Promise<Array>} - Promesa que resuelve a un array de entregas
 */
tarea.obtenerEntregasDeAlumno = async (alumnoId, tareaIds) => {
    if (!tareaIds || tareaIds.length === 0) {
        return [];
    }
    
    try {
        const placeholders = tareaIds.map(() => '?').join(',');
        const sql = `
            SELECT tc.*
            FROM tarea_calificacion tc
            WHERE tc.usuario_id = ? AND tc.tarea_id IN (${placeholders})
        `;
        
        return await queryArray(sql, [alumnoId, ...tareaIds]);
    } catch (error) {
        console.error('Error al obtener entregas del alumno:', error);
        throw error;
    }
};

/**
 * Obtiene todas las tareas asociadas al curso en el que está matriculado un alumno
 * @param {number} alumnoId - ID del alumno
 * @param {boolean} soloVisibles - Si es true, solo devuelve tareas visibles
 * @returns {Promise<Array>} - Promesa que resuelve a un array de tareas con información de entregas
 */
tarea.obtenerTareasCursoAlumno = async (alumnoId, soloVisibles = true) => {
    try {
        // 1. Obtener el curso en el que está matriculado el alumno
        const cursoQuery = `
            SELECT ca.curso_id 
            FROM curso_usuario ca 
            WHERE ca.usuario_id = ?
        `;
        
        const cursoResultado = await queryArray(cursoQuery, [alumnoId]);
        
        if (!cursoResultado.length) {
            console.log('No se encontró ningún curso para el alumno:', alumnoId);
            return [];
        }
        
        const cursoId = cursoResultado[0].curso_id;
        
        // 2. Obtener todas las tareas del curso
        const tareasQuery = `
            SELECT t.*, 
                tema.nombre AS tema_nombre,
                a.id AS asignatura_id, 
                a.nombre AS asignatura_nombre,
                c.id AS curso_id,
                c.nombre AS curso_nombre,
                u.nombre AS creador_nombre,
                u.apellido AS creador_apellido
            FROM tarea t
            JOIN tema ON t.tema_id = tema.id
            JOIN asignatura a ON tema.asignatura_id = a.id
            JOIN curso c ON a.curso_id = c.id
            JOIN usuarios u ON t.creado_por = u.id
            WHERE c.id = ? ${soloVisibles ? 'AND t.visible = 1' : ''}
            ORDER BY t.fecha_entrega ASC
        `;
        
        const tareas = await queryArray(tareasQuery, [cursoId]);
        
        if (tareas.length === 0) {
            console.log('No se encontraron tareas para el curso:', cursoId);
            return [];
        }
        
        // 3. Obtener las entregas del alumno para estas tareas
        const tareaIds = tareas.map(tarea => tarea.id);
        
        const entregas = await tarea.obtenerEntregasDeAlumno(alumnoId, tareaIds);
        
        // 4. Combinar tareas con entregas
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
        
        return tareasConEntregas;
    } catch (error) {
        console.error('Error al obtener tareas del curso del alumno:', error);
        throw error;
    }
};

module.exports = tarea;