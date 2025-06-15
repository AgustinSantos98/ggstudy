/**
 * Modelo para la tabla curso_usuario que gestiona las matriculaciones de alumnos en cursos
 */

const db = require('../config/db');

/**
 * Obtiene todos los registros de curso_usuario
 * @returns {Promise} Promesa con los resultados
 */
const getAll = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM curso_usuario', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Obtiene un registro específico de curso_usuario por ID
 * @param {number} id - ID del registro
 * @returns {Promise} Promesa con el resultado
 */
const getById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM curso_usuario WHERE id = ?', [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

/**
 * Obtiene todos los alumnos matriculados en un curso específico
 * @param {number} cursoId - ID del curso
 * @returns {Promise} Promesa con los resultados
 */
const getAlumnosByCursoId = (cursoId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT u.*
      FROM usuarios u
      INNER JOIN curso_usuario cu ON u.id = cu.usuario_id
      WHERE cu.curso_id = ? AND u.rol = 'alumno'
    `;

    db.query(query, [cursoId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Obtiene todos los cursos en los que está matriculado un alumno
 * @param {number} usuarioId - ID del alumno
 * @returns {Promise} Promesa con los resultados
 */
const getCursosByAlumnoId = (usuarioId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.*
      FROM curso c
      INNER JOIN curso_usuario cu ON c.id = cu.curso_id
      WHERE cu.usuario_id = ?
    `;

    db.query(query, [usuarioId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Verifica si un alumno está matriculado en un curso específico
 * @param {number} usuarioId - ID del alumno
 * @param {number} cursoId - ID del curso
 * @returns {Promise} Promesa con resultado booleano
 */
const isAlumnoEnrolled = (usuarioId, cursoId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM curso_usuario WHERE usuario_id = ? AND curso_id = ?';

    db.query(query, [usuarioId, cursoId], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

/**
 * Crea un nuevo registro en curso_usuario (matricula un alumno)
 * @param {Object} cursoUsuario - Datos del registro
 * @returns {Promise} Promesa con el resultado de la inserción
 */
const create = (cursoUsuario) => {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO curso_usuario SET ?', cursoUsuario, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Actualiza un registro existente de curso_usuario
 * @param {number} id - ID del registro
 * @param {Object} cursoUsuario - Datos actualizados
 * @returns {Promise} Promesa con el resultado de la actualización
 */
const update = (id, cursoUsuario) => {
  return new Promise((resolve, reject) => {
    db.query('UPDATE curso_usuario SET ? WHERE id = ?', [cursoUsuario, id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Elimina un registro de curso_usuario por ID
 * @param {number} id - ID del registro
 * @returns {Promise} Promesa con el resultado de la eliminación
 */
const remove = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM curso_usuario WHERE id = ?', [id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Elimina un registro de curso_usuario por ID de alumno y curso
 * @param {number} usuarioId - ID del alumno
 * @param {number} cursoId - ID del curso
 * @returns {Promise} Promesa con el resultado de la eliminación
 */
const removeByUsuarioAndCurso = (usuarioId, cursoId) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM curso_usuario WHERE usuario_id = ? AND curso_id = ?',
      [usuarioId, cursoId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Obtiene todas las relaciones curso-usuario (matriculaciones)
 * @returns {Promise} - Promesa que resuelve a un array de relaciones
 */
const obtenerTodos = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT cu.id, cu.curso_id, cu.usuario_id as alumno_id,
             c.nombre as curso_nombre,
             u.nombre as alumno_nombre, u.apellido as alumno_apellido
      FROM curso_usuario cu
      INNER JOIN curso c ON cu.curso_id = c.id
      INNER JOIN usuarios u ON cu.usuario_id = u.id
      WHERE u.rol = 'alumno'
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener todas las matriculaciones:', err);
        return reject(err);
      }
      resolve(results);
    });
  });
};

/**
 * Obtiene una relación curso-usuario por su ID
 * @param {number} id - ID de la relación
 * @returns {Promise} - Promesa que resuelve a una relación o null
 */
const obtenerPorId = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT cu.id, cu.curso_id, cu.usuario_id as alumno_id,
             c.nombre as curso_nombre,
             u.nombre as alumno_nombre, u.apellido as alumno_apellido
      FROM curso_usuario cu
      INNER JOIN curso c ON cu.curso_id = c.id
      INNER JOIN usuarios u ON cu.usuario_id = u.id
      WHERE cu.id = ? AND u.rol = 'alumno'
    `;
    db.query(sql, [id], (err, results) => {
      if (err) {
        console.error('Error al obtener matriculación por ID:', err);
        return reject(err);
      }
      resolve(results[0] || null);
    });
  });
};

/**
 * Elimina una matriculación por el ID de la relación
 * @param {number} id - ID de la relación a eliminar
 * @returns {Promise} - Promesa que resuelve a true si se eliminó correctamente
 */
const eliminar = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM curso_usuario WHERE id = ?`;
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error al eliminar matriculación por ID:', err);
        return reject(err);
      }
      resolve(result.affectedRows > 0);
    });
  });
};

/**
 * Crea una nueva matriculación (similar a 'create' pero con verificación de rol alumno)
 * @param {number} usuario_id - ID del alumno
 * @param {number} curso_id - ID del curso
 * @returns {Promise} Promesa con el resultado de la inserción
 */
const crearMatriculacion = (usuario_id, curso_id) => {
    return new Promise((resolve, reject) => {
        // Primero, verificar si el usuario tiene el rol de alumno
        const checkRolSql = `SELECT rol FROM usuarios WHERE id = ?`;
        db.query(checkRolSql, [usuario_id], (err, results) => {
            if (err) {
                console.error('Error al verificar rol de usuario:', err);
                return reject(err);
            }
            if (!results.length || results[0].rol !== 'alumno') {
                return reject(new Error('Solo los usuarios con rol de alumno pueden ser matriculados'));
            }
            // Proceder con la matriculación si el rol es correcto
            const sql = `INSERT INTO curso_usuario (usuario_id, curso_id) VALUES (?, ?)`;
            db.query(sql, [usuario_id, curso_id], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return reject(new Error('El alumno ya está matriculado en este curso'));
                    }
                    console.error('Error al matricular alumno en el curso:', err);
                    return reject(err);
                }
                resolve(result.insertId);
            });
        });
    });
};

module.exports = {
  getAll,
  getById,
  getAlumnosByCursoId,
  getCursosByAlumnoId,
  isAlumnoEnrolled,
  create,
  update,
  remove,
  removeByUsuarioAndCurso,
  obtenerTodos,
  obtenerPorId,
  eliminar,
  crearMatriculacion
};