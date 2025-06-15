const db = require('../config/db');

// Funciones auxiliares queryArray y querySingle (pueden ser importadas de un utils/dbHelpers.js)
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

const TareaCalificacion = {};

const CAMPOS_TAREA_CALIFICACION = `tc.id, tc.usuario_id, tc.tarea_id, tc.url, tc.texto, tc.fecha_entrega, tc.calificacion, tc.feedback, tc.corregido_por, tc.fecha_correccion`;
const JOINS_DETALLES = `
    FROM tarea_calificacion tc
    LEFT JOIN usuarios alumno ON tc.usuario_id = alumno.id
    LEFT JOIN tarea t ON tc.tarea_id = t.id
    LEFT JOIN tema tm ON t.tema_id = tm.id
    LEFT JOIN asignatura a ON tm.asignatura_id = a.id
    LEFT JOIN usuarios profesor ON tc.corregido_por = profesor.id
`;
const CAMPOS_CON_DETALLES = `${CAMPOS_TAREA_CALIFICACION},
    alumno.nombre AS alumno_nombre, alumno.apellido AS alumno_apellido,
    t.titulo AS tarea_titulo,
    a.nombre AS asignatura_nombre,
    profesor.nombre AS profesor_nombre, profesor.apellido AS profesor_apellido`;

// Crear una nueva entrega/calificación
TareaCalificacion.crear = (data) => {
    return new Promise((resolve, reject) => {
        const { usuario_id, tarea_id, url, texto } = data;
        const fecha_entrega = new Date();

        const sql = `INSERT INTO tarea_calificacion (usuario_id, tarea_id, url, texto, fecha_entrega)
                     VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [usuario_id, tarea_id, url, texto, fecha_entrega], (err, result) => {
            if (err) {
                console.error("Error al crear TareaCalificacion:", err);
                if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                    if (err.message.includes('tarea_calificacion_ibfk_1')) { // Asumiendo que esta es la FK para usuario_id
                        return reject(new Error('El alumno especificado no existe o no tiene el rol correcto.'));
                    }
                    if (err.message.includes('tarea_calificacion_ibfk_2')) { // Asumiendo que esta es la FK para tarea_id
                        return reject(new Error('La tarea especificada no existe.'));
                    }
                }
                // Asumiendo que tienes un unique constraint idx_usuario_tarea_unique(usuario_id, tarea_id)
                if (err.code === 'ER_DUP_ENTRY' && err.message.includes('idx_usuario_tarea_unique')) {
                     return reject(new Error('Ya existe una entrega para este alumno y esta tarea.'));
                }
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

// Actualizar una calificación (hecho por un profesor)
TareaCalificacion.actualizarCalificacion = (id, data) => {
    return new Promise((resolve, reject) => {
        const { calificacion, feedback, corregido_por } = data;
        const fecha_correccion = new Date();

        const sql = `UPDATE tarea_calificacion
                     SET calificacion = ?, feedback = ?, corregido_por = ?, fecha_correccion = ?
                     WHERE id = ?`;
        db.query(sql, [calificacion, feedback, corregido_por, fecha_correccion, id], (err, result) => {
            if (err) {
                 console.error("Error al actualizar calificación:", err);
                 if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.message.includes('tarea_calificacion_ibfk_3')) { // Asumiendo FK para corregido_por
                    return reject(new Error('El profesor especificado para "corregido_por" no existe o no tiene el rol correcto.'));
                 }
                return reject(err);
            }
            resolve(result.affectedRows > 0);
        });
    });
};

// Obtener una calificación por ID con detalles
TareaCalificacion.obtenerPorId = (id) => {
    const sql = `SELECT ${CAMPOS_CON_DETALLES} ${JOINS_DETALLES} WHERE tc.id = ?`;
    return querySingle(sql, [id]);
};

// Obtener todas las calificaciones para una Tarea específica (con detalles de alumno)
TareaCalificacion.obtenerPorTareaId = (tarea_id, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const sql = `SELECT ${CAMPOS_CON_DETALLES} ${JOINS_DETALLES}
                         WHERE tc.tarea_id = ? ORDER BY alumno.apellido ASC, alumno.nombre ASC, tc.fecha_entrega DESC LIMIT ? OFFSET ?`;
            const countSql = `SELECT COUNT(*) as total FROM tarea_calificacion WHERE tarea_id = ?`;
            
            const results = await queryArray(sql, [tarea_id, limit, offset]);
            const countResult = await querySingle(countSql, [tarea_id]);
            
            resolve({
                data: results,
                pagination: { total: countResult ? countResult.total : 0, page, limit, totalPages: countResult ? Math.ceil(countResult.total / limit) : 0 }
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Obtener todas las calificaciones de un Alumno específico (con detalles de tarea)
TareaCalificacion.obtenerPorUsuarioId = (usuario_id, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            const sql = `SELECT ${CAMPOS_CON_DETALLES} ${JOINS_DETALLES}
                         WHERE tc.usuario_id = ? 
                         ORDER BY a.nombre ASC, tm.nombre ASC, t.fecha_entrega DESC, tc.fecha_entrega DESC 
                         LIMIT ? OFFSET ?`;
            const countSql = `SELECT COUNT(*) as total FROM tarea_calificacion WHERE usuario_id = ?`;

            const results = await queryArray(sql, [usuario_id, limit, offset]);
            const countResult = await querySingle(countSql, [usuario_id]);

            resolve({
                data: results,
                pagination: { total: countResult ? countResult.total : 0, page, limit, totalPages: countResult ? Math.ceil(countResult.total / limit) : 0 }
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Obtener una entrega específica de un usuario para una tarea
TareaCalificacion.obtenerPorUsuarioYTarea = (usuario_id, tarea_id) => {
    const sql = `SELECT ${CAMPOS_CON_DETALLES} ${JOINS_DETALLES} WHERE tc.usuario_id = ? AND tc.tarea_id = ?`;
    return querySingle(sql, [usuario_id, tarea_id]);
};

// Un alumno puede necesitar actualizar su entrega si aún no está calificada
TareaCalificacion.actualizarEntregaAlumno = (id, usuario_id, data) => {
    return new Promise((resolve, reject) => {
        const { url, texto } = data;
        const fecha_entrega_actualizada = new Date();
        const sql = `UPDATE tarea_calificacion
                     SET url = ?, texto = ?, fecha_entrega = ?
                     WHERE id = ? AND usuario_id = ? AND calificacion IS NULL`;
        db.query(sql, [url, texto, fecha_entrega_actualizada, id, usuario_id], (err, result) => {
            if (err) return reject(err);
            resolve(result.affectedRows > 0);
        });
    });
};

// Eliminar una entrega (hecho por alumno si no calificada, o admin/profesor con permisos)
TareaCalificacion.eliminar = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM tarea_calificacion WHERE id = ?`;
        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);
            resolve(result.affectedRows > 0);
        });
    });
};

// Obtener todas las entregas asociadas a las asignaturas de un profesor
TareaCalificacion.obtenerPorProfesorId = async (profesor_id, page = 1, limit = 10) => {
    try {
        // Calculamos el offset para la paginación
        const offset = (page - 1) * limit;
        
        // Consulta para obtener el total de registros
        const countSql = `
            SELECT COUNT(DISTINCT tc.id) as total
            FROM tarea_calificacion tc
            JOIN tarea t ON tc.tarea_id = t.id
            JOIN tema te ON t.tema_id = te.id
            JOIN asignatura a ON te.asignatura_id = a.id
            WHERE a.profesor_id = ?
        `;
        
        // Consulta principal con joins para obtener todos los datos necesarios
        const sql = `
            SELECT ${CAMPOS_TAREA_CALIFICACION},
                alumno.nombre AS alumno_nombre, alumno.apellido AS alumno_apellido,
                t.titulo AS tarea_titulo,
                te.nombre AS tema_nombre,
                a.nombre AS asignatura_nombre,
                a.id AS asignatura_id,
                profesor.nombre AS corrector_nombre, profesor.apellido AS corrector_apellido
            FROM tarea_calificacion tc
            JOIN usuarios alumno ON tc.usuario_id = alumno.id
            JOIN tarea t ON tc.tarea_id = t.id
            JOIN tema te ON t.tema_id = te.id
            JOIN asignatura a ON te.asignatura_id = a.id
            LEFT JOIN usuarios profesor ON tc.corregido_por = profesor.id
            WHERE a.profesor_id = ?
            ORDER BY tc.fecha_entrega DESC
            LIMIT ? OFFSET ?
        `;
        
        // Ejecutamos ambas consultas
        const [countResult, entregas] = await Promise.all([
            querySingle(countSql, [profesor_id]),
            queryArray(sql, [profesor_id, parseInt(limit), offset])
        ]);
        
        // Calculamos la información de paginación
        const total = countResult ? countResult.total : 0;
        const totalPages = Math.ceil(total / limit);
        
        return {
            data: entregas,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error al obtener entregas por profesor:', error);
        throw error;
    }
};

module.exports = TareaCalificacion;