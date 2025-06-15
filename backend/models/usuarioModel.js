const db = require('../config/db');
const bcrypt = require('bcrypt'); // Necesario para hashear contraseña en actualizar

/**
 * Modelo para la entidad Usuario
 * Proporciona métodos para realizar operaciones CRUD sobre la tabla usuarios
 */
const usuario = {};

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
 * Campos a seleccionar por defecto para no exponer la contraseña.
 */
const CAMPOS_SIN_CONTRASENA = 'id, dni, nombre, apellido, rol, email, fecha_nacimiento, fecha_ingreso, fecha_fin, telefono, foto_perfil_url';

/**
 * Obtiene todos los usuarios con paginación y filtros.
 * @param {number} page - Número de página.
 * @param {number} limit - Cantidad de registros por página.
 * @param {object} filtros - Objeto con filtros (rol, nombre, email, dni).
 * @returns {Promise} - Promesa que resuelve a un objeto con los resultados y metadata.
 */
usuario.obtenerTodosPaginado = (page = 1, limit = 10, filtros = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            let baseSql = `SELECT ${CAMPOS_SIN_CONTRASENA} FROM usuarios`;
            let countBaseSql = `SELECT COUNT(*) as total FROM usuarios`;
            
            const whereClauses = [];
            const params = [];
            const countParams = [];

            if (filtros.rol) {
                whereClauses.push('rol = ?');
                params.push(filtros.rol);
                countParams.push(filtros.rol);
            }
            if (filtros.nombre) {
                // Buscar en nombre o apellido
                whereClauses.push('(nombre LIKE ? OR apellido LIKE ? OR nombre = ?)');
                const searchTerm = `%${filtros.nombre}%`;
                params.push(searchTerm, searchTerm, filtros.nombre);
                countParams.push(searchTerm, searchTerm, filtros.nombre);
            }
            if (filtros.email) {
                whereClauses.push('email LIKE ?');
                params.push(`%${filtros.email}%`);
                countParams.push(`%${filtros.email}%`);
            }
            if (filtros.dni) {
                whereClauses.push('(dni = ? OR dni LIKE ?)');
                params.push(filtros.dni, `%${filtros.dni}%`);
                countParams.push(filtros.dni, `%${filtros.dni}%`);
            }

            if (whereClauses.length > 0) {
                const whereSql = ' WHERE ' + whereClauses.join(' AND ');
                baseSql += whereSql;
                countBaseSql += whereSql;
            }

            baseSql += ' ORDER BY apellido ASC, nombre ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const results = await queryArray(baseSql, params);
            const countResult = await querySingle(countBaseSql, countParams);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results, // Ya no tienen contraseña por CAMPOS_SIN_CONTRASENA
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    filtros
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Obtiene un usuario por su ID (sin contraseña).
 * @param {number} id - ID del usuario.
 * @returns {Promise} - Promesa que resuelve a un usuario o null.
 */
usuario.obtenerPorId = (id) => {
    const sql = `SELECT ${CAMPOS_SIN_CONTRASENA} FROM usuarios WHERE id = ?`;
    return querySingle(sql, [id]);
};

/**
 * Obtiene un usuario por su ID (CON contraseña).
 * Usar con precaución, solo para autenticación o procesos internos.
 * @param {number} id - ID del usuario.
 * @returns {Promise} - Promesa que resuelve a un usuario completo o null.
 */
usuario.obtenerPorIdConContrasena = (id) => {
    const sql = `SELECT * FROM usuarios WHERE id = ?`;
    return querySingle(sql, [id]);
};

/**
 * Obtiene un usuario por su email (CON contraseña).
 * Usar con precaución, principalmente para login.
 * @param {string} email - Email del usuario.
 * @returns {Promise} - Promesa que resuelve a un usuario completo o null.
 */
usuario.obtenerPorEmailConContrasena = (email) => {
    const sql = `SELECT * FROM usuarios WHERE email = ?`;
    return querySingle(sql, [email]);
};

/**
 * Obtiene un usuario por su email (sin contraseña).
 * @param {string} email - Email del usuario.
 * @returns {Promise} - Promesa que resuelve a un usuario o null.
 */
usuario.obtenerPorEmail = (email) => {
    const sql = `SELECT ${CAMPOS_SIN_CONTRASENA} FROM usuarios WHERE email = ?`;
    return querySingle(sql, [email]);
};

/**
 * Obtiene un usuario por su DNI (sin contraseña).
 * @param {string} dni - DNI del usuario.
 * @returns {Promise} - Promesa que resuelve a un usuario o null.
 */
usuario.obtenerPorDni = (dni) => {
    const sql = `SELECT ${CAMPOS_SIN_CONTRASENA} FROM usuarios WHERE dni = ?`;
    return querySingle(sql, [dni]);
};

/**
 * Crea un nuevo usuario. La contraseña ya debe venir hasheada.
 * @param {Object} usuarioData - Datos del usuario.
 * @returns {Promise} - Promesa que resuelve al ID del usuario creado.
 */
usuario.crear = (usuarioData) => {
    return new Promise((resolve, reject) => {
        
        const { 
            dni, nombre, apellido, rol, email, contrasena, 
            fecha_nacimiento = null, fecha_ingreso = new Date(), fecha_fin = null, 
            telefono = null, foto_perfil_url = null 
        } = usuarioData;

        const sql = `INSERT INTO usuarios (dni, nombre, apellido, rol, email, contrasena, fecha_nacimiento, fecha_ingreso, fecha_fin, telefono, foto_perfil_url)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [
            dni, nombre, apellido, rol, email, contrasena, 
            fecha_nacimiento, fecha_ingreso, fecha_fin, 
            telefono, foto_perfil_url
        ], (err, result) => {
            if (err) {
                console.error('Error al crear el usuario:', err);
                // ER_DUP_ENTRY para DNI o email únicos
                if (err.code === 'ER_DUP_ENTRY') {
                    if (err.message.includes('dni_UNIQUE')) {
                        return reject(new Error('El DNI ya está registrado.'));
                    } else if (err.message.includes('email_UNIQUE')) {
                        return reject(new Error('El email ya está registrado.'));
                    }
                }
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

/**
 * Actualiza un usuario existente. Si se incluye 'contrasena' en usuarioData, se hasheará.
 * @param {number} id - ID del usuario a actualizar.
 * @param {Object} usuarioData - Datos a actualizar.
 * @returns {Promise<boolean>} - True si se actualizó algo.
 */
usuario.actualizar = async (id, usuarioData) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Primero, verificar si hay cambios en email o DNI
            const usuarioActual = await usuario.obtenerPorId(id);
            
            if (!usuarioActual) {
                return reject(new Error('Usuario no encontrado'));
            }
            
            // Verificar si el email ha cambiado y ya existe
            if (usuarioData.email && usuarioData.email !== usuarioActual.email) {
                const emailExistente = await usuario.obtenerPorEmail(usuarioData.email);
                if (emailExistente && emailExistente.id !== id) {
                    return reject(new Error('El email ya está en uso por otro usuario.'));
                }
            }
            
            // Verificar si el DNI ha cambiado y ya existe
            if (usuarioData.dni && usuarioData.dni !== usuarioActual.dni) {
                const dniExistente = await usuario.obtenerPorDni(usuarioData.dni);
                if (dniExistente && dniExistente.id !== id) {
                    return reject(new Error('El DNI ya está en uso por otro usuario.'));
                }
            }
            
            const fields = [];
            const values = [];

            // Lista de campos permitidos para actualizar según modelo.mdc
            const camposPermitidos = [
                'dni', 'nombre', 'apellido', 'rol', 'email', 'contrasena',
                'fecha_nacimiento', 'fecha_ingreso', 'fecha_fin', 'telefono', 'foto_perfil_url'
            ];

            for (const campo of camposPermitidos) {
                if (usuarioData[campo] !== undefined) {
                    if (campo === 'contrasena' && usuarioData[campo]) {
                        // Hashear contraseña si se provee una nueva
                        fields.push('contrasena = ?');
                        values.push(await bcrypt.hash(usuarioData[campo], 10));
                    } else {
                        fields.push(`${campo} = ?`);
                        values.push(usuarioData[campo]);
                    }
                }
            }

            if (fields.length === 0) {
                return resolve(false); // No hay nada que actualizar
            }

            values.push(id);
            const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;

            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Error al actualizar el usuario:', err);
                    return reject(err);
                }
                resolve(result.affectedRows > 0);
            });
        } catch (error) {
            console.error('Error en la actualización del usuario:', error);
            reject(error);
        }
    });
};

/**
 * Elimina un usuario.
 * @param {number} id - ID del usuario a eliminar.
 * @returns {Promise<boolean>} - True si se eliminó.
 */
usuario.eliminar = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM usuarios WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar el usuario:', err);
                // El controlador se encargará de errores de FK más específicos si es necesario.
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

/**
 * Obtiene todos los cursos en los que un alumno está matriculado
 * @param {number} alumnoId - ID del alumno
 * @returns {Promise} - Promesa que resuelve a un array de cursos
 */
usuario.obtenerCursosAlumno = (alumnoId) => {
    const sql = `
        SELECT c.*
        FROM curso c
        INNER JOIN curso_usuario cu ON c.id = cu.curso_id
        WHERE cu.usuario_id = ?
    `;
    return queryArray(sql, [alumnoId]);
};

/**
 * Obtiene los alumnos asociados a un profesor a través de sus asignaturas
 * @param {number} profesorId - ID del profesor
 * @param {number} page - Número de página (comienza en 1)
 * @param {number} limit - Cantidad de registros por página
 * @returns {Promise} - Promesa que resuelve a un objeto con los resultados y metadata
 */
usuario.obtenerAlumnosPorProfesorId = (profesorId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            
            // Consulta para obtener los alumnos únicos del profesor
            const sql = `
                SELECT DISTINCT u.id, u.dni, u.nombre, u.apellido, u.email, u.rol, 
                       u.fecha_nacimiento, u.fecha_ingreso, u.telefono, u.foto_perfil_url
                FROM usuarios u
                INNER JOIN curso_usuario cu ON u.id = cu.usuario_id
                INNER JOIN asignatura a ON cu.curso_id = a.curso_id
                WHERE a.profesor_id = ? AND u.rol = 'alumno'
                ORDER BY u.apellido ASC, u.nombre ASC
                LIMIT ? OFFSET ?
            `;
            
            // Consulta para contar el total de alumnos únicos
            const countSql = `
                SELECT COUNT(DISTINCT u.id) as total
                FROM usuarios u
                INNER JOIN curso_usuario cu ON u.id = cu.usuario_id
                INNER JOIN asignatura a ON cu.curso_id = a.curso_id
                WHERE a.profesor_id = ? AND u.rol = 'alumno'
            `;
            
            // Parámetros para las consultas
            const params = [profesorId, limit, offset];
            const countParams = [profesorId];
            
            // Ejecutar consultas en paralelo
            const [results, countResult] = await Promise.all([
                queryArray(sql, params),
                querySingle(countSql, countParams)
            ]);
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            resolve({
                data: results,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    profesorId: parseInt(profesorId, 10)
                }
            });
        } catch (error) {
            console.error('Error en obtenerAlumnosPorProfesorId:', error);
            reject(error);
        }
    });
};

module.exports = usuario; 