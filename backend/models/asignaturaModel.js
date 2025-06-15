const db = require('../config/db');

/**
 * Modelo para la entidad Asignatura
 * Proporciona métodos para realizar operaciones CRUD sobre la tabla asignatura
 */
const asignatura = {};

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
 * Obtiene todas las asignaturas con paginación
 * @param {number} page - Número de página (comienza en 1)
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con los resultados y metadata
 */
asignatura.obtenerTodosPaginado = (page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            
            const sql = `
                SELECT a.id, a.curso_id, a.nombre, a.descripcion, a.profesor_id,
                       c.nombre as curso_nombre, u.nombre as profesor_nombre, u.apellido as profesor_apellido
                FROM asignatura a
                INNER JOIN curso c ON a.curso_id = c.id
                LEFT JOIN usuarios u ON a.profesor_id = u.id AND u.rol = 'profesor'
                LIMIT ? OFFSET ?
            `;
            
            const countSql = `SELECT COUNT(*) as total FROM asignatura`;
            
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
 * Obtiene todas las asignaturas
 * @returns {Promise} - Promesa que resuelve a un array de asignaturas
 */
asignatura.obtenerTodos = () => {
    const sql = `
        SELECT a.id, a.curso_id, a.nombre, a.descripcion, a.profesor_id,
               c.nombre as curso_nombre, u.nombre as profesor_nombre, u.apellido as profesor_apellido
        FROM asignatura a
        INNER JOIN curso c ON a.curso_id = c.id
        LEFT JOIN usuarios u ON a.profesor_id = u.id AND u.rol = 'profesor'
    `;
    return queryArray(sql);
};

/**
 * Obtiene una asignatura por su ID
 * @param {number} id - ID de la asignatura
 * @returns {Promise} - Promesa que resuelve a una asignatura o null
 */
asignatura.obtenerPorId = (id) => {
    const sql = `
        SELECT a.id, a.curso_id, a.nombre, a.descripcion, a.profesor_id,
               c.nombre as curso_nombre, u.nombre as profesor_nombre, u.apellido as profesor_apellido
        FROM asignatura a
        INNER JOIN curso c ON a.curso_id = c.id
        LEFT JOIN usuarios u ON a.profesor_id = u.id AND u.rol = 'profesor'
        WHERE a.id = ?
    `;
    return querySingle(sql, [id]);
};

/**
 * Obtiene todas las asignaturas asociadas a un curso específico con paginación
 * @param {number} cursoId - ID del curso
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con asignaturas y metadata
 */
asignatura.obtenerPorCursoIdPaginado = (cursoId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE a.curso_id = ?';
            const params = [cursoId];
            
            const sql = `
                SELECT a.id, a.curso_id, a.nombre, a.descripcion, a.profesor_id,
                       c.nombre as curso_nombre, u.nombre as profesor_nombre, u.apellido as profesor_apellido
                FROM asignatura a
                INNER JOIN curso c ON a.curso_id = c.id
                LEFT JOIN usuarios u ON a.profesor_id = u.id AND u.rol = 'profesor'
                ${whereClause}
                LIMIT ? OFFSET ?
            `;
            params.push(limit, offset);
            
            const countSql = `SELECT COUNT(*) as total FROM asignatura a ${whereClause}`;
            
            const results = await queryArray(sql, params);
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
 * Obtiene todas las asignaturas asociadas a un curso específico
 * @param {number} cursoId - ID del curso
 * @returns {Promise} - Promesa que resuelve a un array de asignaturas
 */
asignatura.obtenerPorCursoId = (cursoId) => {
    const sql = `
        SELECT a.id, a.curso_id, a.nombre, a.descripcion, a.profesor_id,
               c.nombre as curso_nombre, u.nombre as profesor_nombre, u.apellido as profesor_apellido
        FROM asignatura a
        INNER JOIN curso c ON a.curso_id = c.id
        LEFT JOIN usuarios u ON a.profesor_id = u.id AND u.rol = 'profesor'
        WHERE a.curso_id = ?
    `;
    const params = [cursoId];
    return queryArray(sql, params);
};

/**
 * Obtiene todas las asignaturas asociadas a un profesor específico con paginación
 * @param {number} profesorId - ID del profesor
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con asignaturas y metadata
 */
asignatura.obtenerPorProfesorIdPaginado = (profesorId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const sql = `
                SELECT a.id, a.curso_id, a.nombre, a.descripcion, a.profesor_id,
                       c.nombre as curso_nombre
                FROM asignatura a
                INNER JOIN curso c ON a.curso_id = c.id
                LEFT JOIN usuarios u ON a.profesor_id = u.id AND u.rol = 'profesor'
                WHERE a.profesor_id = ?
                LIMIT ? OFFSET ?
            `;
            const countSql = `SELECT COUNT(*) as total FROM asignatura WHERE profesor_id = ?`;
            
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
                    totalPages,
                    profesorId
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Crea una nueva asignatura
 * @param {Object} asignaturaData - Datos de la asignatura a crear
 * @returns {Promise} - Promesa que resuelve al ID de la asignatura creada
 */
asignatura.crear = ({ curso_id, nombre, descripcion, profesor_id = null }) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO asignatura (curso_id, nombre, descripcion, profesor_id) VALUES (?, ?, ?, ?)`;
        db.query(sql, [curso_id, nombre, descripcion, profesor_id], (err, result) => {
            if (err) {
                console.error('Error al crear la asignatura:', err);
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

/**
 * Actualiza una asignatura existente
 * @param {number} id - ID de la asignatura a actualizar
 * @param {Object} asignaturaData - Datos actualizados de la asignatura
 * @returns {Promise} - Promesa que resuelve a true si se actualizó correctamente
 */
asignatura.actualizar = (id, { curso_id, nombre, descripcion, profesor_id }) => {
    return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];
        if (curso_id !== undefined) { fields.push('curso_id = ?'); values.push(curso_id); }
        if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }
        if (descripcion !== undefined) { fields.push('descripcion = ?'); values.push(descripcion); }
        if (profesor_id !== undefined) { fields.push('profesor_id = ?'); values.push(profesor_id); }

        if (fields.length === 0) {
            return resolve(true);
        }

        values.push(id);
        const sql = `UPDATE asignatura SET ${fields.join(', ')} WHERE id = ?`;
        
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error al actualizar la asignatura:', err);
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Elimina una asignatura
 * @param {number} id - ID de la asignatura a eliminar
 * @returns {Promise} - Promesa que resuelve a true si se eliminó correctamente
 */
asignatura.eliminar = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM asignatura WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar la asignatura:', err);
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return reject(new Error('No se puede eliminar la asignatura porque tiene temas asociados.'));
                }
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Busca asignaturas por nombre con paginación
 * @param {string} nombre - Nombre a buscar
 * @param {number} page - Número de página
 * @param {number} limit - Límite de resultados
 * @returns {Promise} - Promesa que resuelve a un objeto con asignaturas y metadata
 */
asignatura.buscarPorNombrePaginado = (nombre, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const searchTerm = `%${nombre}%`;
            const sql = `
                SELECT a.id, a.curso_id, a.nombre, a.descripcion, a.profesor_id,
                       c.nombre as curso_nombre, u.nombre as profesor_nombre, u.apellido as profesor_apellido
                FROM asignatura a
                INNER JOIN curso c ON a.curso_id = c.id
                LEFT JOIN usuarios u ON a.profesor_id = u.id AND u.rol = 'profesor'
                WHERE a.nombre LIKE ?
                LIMIT ? OFFSET ?
            `;
            const countSql = `SELECT COUNT(*) as total FROM asignatura WHERE nombre LIKE ?`;
            
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
                    query: nombre
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = asignatura;