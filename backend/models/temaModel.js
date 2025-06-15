const db = require('../config/db');

/**
 * Modelo para la entidad Tema
 * Proporciona métodos para realizar operaciones CRUD sobre la tabla tema
 */
const tema = {};

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
 * Obtiene todos los temas con paginación
 * @param {number} page - Número de página (comienza en 1)
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con los resultados y metadata
 */
tema.obtenerTodosPaginado = (page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            
            const sql = `
                SELECT t.id, t.asignatura_id, t.nombre AS tema_nombre,
                       a.nombre AS asignatura_nombre, c.id AS curso_id, c.nombre AS curso_nombre
                FROM tema t
                INNER JOIN asignatura a ON t.asignatura_id = a.id
                INNER JOIN curso c ON a.curso_id = c.id
                LIMIT ? OFFSET ?
            `;
            
            const countSql = `SELECT COUNT(*) as total FROM tema`;
            
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
 * Obtiene todos los temas
 * @returns {Promise} - Promesa que resuelve a un array de temas
 */
tema.obtenerTodos = () => {
    const sql = `
        SELECT t.id, t.asignatura_id, t.nombre AS tema_nombre,
               a.nombre AS asignatura_nombre, c.id AS curso_id, c.nombre AS curso_nombre
        FROM tema t
        INNER JOIN asignatura a ON t.asignatura_id = a.id
        INNER JOIN curso c ON a.curso_id = c.id
    `;
    return queryArray(sql);
};

/**
 * Obtiene un tema por su ID
 * @param {number} id - ID del tema
 * @returns {Promise} - Promesa que resuelve a un tema o null
 */
tema.obtenerPorId = (id) => {
    const sql = `
        SELECT t.id, t.asignatura_id, t.nombre AS tema_nombre,
               a.nombre AS asignatura_nombre, c.id AS curso_id, c.nombre AS curso_nombre
        FROM tema t
        INNER JOIN asignatura a ON t.asignatura_id = a.id
        INNER JOIN curso c ON a.curso_id = c.id
        WHERE t.id = ?
    `;
    return querySingle(sql, [id]);
};

/**
 * Obtiene todos los temas de una asignatura específica con paginación
 * @param {number} asignaturaId - ID de la asignatura
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con temas y metadata
 */
tema.obtenerPorAsignaturaIdPaginado = (asignaturaId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            
            const sql = `
                SELECT t.id, t.asignatura_id, t.nombre AS tema_nombre,
                       a.nombre AS asignatura_nombre, c.id AS curso_id, c.nombre AS curso_nombre
                FROM tema t
                INNER JOIN asignatura a ON t.asignatura_id = a.id
                INNER JOIN curso c ON a.curso_id = c.id
                WHERE t.asignatura_id = ?
                LIMIT ? OFFSET ?
            `;
            
            const countSql = `SELECT COUNT(*) as total FROM tema WHERE asignatura_id = ?`;
            
            const results = await queryArray(sql, [asignaturaId, limit, offset]);
            const countResult = await querySingle(countSql, [asignaturaId]);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    asignaturaId
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene todos los temas de una asignatura específica
 * @param {number} asignaturaId - ID de la asignatura
 * @returns {Promise} - Promesa que resuelve a un array de temas
 */
tema.obtenerPorAsignaturaId = (asignaturaId) => {
    const sql = `
        SELECT t.id, t.asignatura_id, t.nombre AS tema_nombre,
               a.nombre AS asignatura_nombre, c.id AS curso_id, c.nombre AS curso_nombre
        FROM tema t
        INNER JOIN asignatura a ON t.asignatura_id = a.id
        INNER JOIN curso c ON a.curso_id = c.id
        WHERE t.asignatura_id = ?
    `;
    return queryArray(sql, [asignaturaId]);
};

/**
 * Crea un nuevo tema
 * @param {Object} temaData - Datos del tema a crear (asignatura_id, nombre)
 * @returns {Promise} - Promesa que resuelve al ID del tema creado
 */
tema.crear = ({ asignatura_id, nombre }) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO tema (asignatura_id, nombre) VALUES (?, ?)`;
        db.query(sql, [asignatura_id, nombre], (err, result) => {
            if (err) {
                console.error('Error al crear el tema:', err);
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

/**
 * Actualiza un tema existente
 * @param {number} id - ID del tema a actualizar
 * @param {Object} temaData - Datos actualizados del tema (asignatura_id, nombre)
 * @returns {Promise} - Promesa que resuelve a true si se actualizó correctamente
 */
tema.actualizar = (id, { asignatura_id, nombre }) => {
    return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];
        if (asignatura_id !== undefined) { fields.push('asignatura_id = ?'); values.push(asignatura_id); }
        if (nombre !== undefined) { fields.push('nombre = ?'); values.push(nombre); }

        if (fields.length === 0) {
            return resolve(true); // No hay nada que actualizar
        }

        values.push(id);
        const sql = `UPDATE tema SET ${fields.join(', ')} WHERE id = ?`;

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error al actualizar el tema:', err);
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Elimina un tema
 * @param {number} id - ID del tema a eliminar
 * @returns {Promise} - Promesa que resuelve a true si se eliminó correctamente
 */
tema.eliminar = (id) => {
    return new Promise((resolve, reject) => {
        // Considerar la eliminación en cascada o la gestión de tareas huérfanas
        const sql = `DELETE FROM tema WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar el tema:', err);
                 if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return reject(new Error('No se puede eliminar el tema porque tiene tareas asociadas.'));
                }
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Busca temas por nombre con paginación
 * @param {string} nombre - Nombre a buscar
 * @param {number} page - Número de página
 * @param {number} limit - Límite de resultados
 * @returns {Promise} - Promesa que resuelve a un objeto con temas y metadata
 */
tema.buscarPorNombrePaginado = (nombre, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const searchTerm = `%${nombre}%`;
            const sql = `
                SELECT t.id, t.asignatura_id, t.nombre AS tema_nombre,
                       a.nombre AS asignatura_nombre, c.id AS curso_id, c.nombre AS curso_nombre
                FROM tema t
                INNER JOIN asignatura a ON t.asignatura_id = a.id
                INNER JOIN curso c ON a.curso_id = c.id
                WHERE t.nombre LIKE ?
                LIMIT ? OFFSET ?
            `;
            const countSql = `
                SELECT COUNT(*) as total 
                FROM tema t 
                INNER JOIN asignatura a ON t.asignatura_id = a.id 
                WHERE t.nombre LIKE ?`
            
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

/**
 * Cuenta cuántos temas tiene una asignatura.
 * @param {number} asignaturaId - ID de la asignatura.
 * @returns {Promise<number>} - Promesa que resuelve al número total de temas.
 */
tema.contarPorAsignaturaId = (asignaturaId) => {
    const sql = `SELECT COUNT(*) as totalTemas FROM tema WHERE asignatura_id = ?`;
    return querySingle(sql, [asignaturaId]).then(result => result ? result.totalTemas : 0);
};

/**
 * Obtiene temas por profesor con paginación
 * @param {number} profesorId - ID del profesor
 * @param {number} page - Número de página
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con temas y metadata
 */
tema.obtenerPorProfesorIdPaginado = (profesorId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;

            const sql = `
                SELECT t.id, t.asignatura_id, t.nombre AS tema_nombre,
                       a.nombre AS asignatura_nombre, c.id AS curso_id, c.nombre AS curso_nombre
                FROM tema t
                INNER JOIN asignatura a ON t.asignatura_id = a.id
                INNER JOIN curso c ON a.curso_id = c.id
                WHERE t.asignatura_id IN (
                    SELECT id FROM asignatura WHERE profesor_id = ?
                )
                LIMIT ? OFFSET ?
            `;
            const countSql = `
                SELECT COUNT(*) as total 
                FROM tema t 
                WHERE t.asignatura_id IN (
                    SELECT id FROM asignatura WHERE profesor_id = ?
                )
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

module.exports = tema; 