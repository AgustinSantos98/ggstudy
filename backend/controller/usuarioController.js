const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuarioModel');
const cursoModel = require('../models/cursoModel'); // Para obtener cursos de alumno
const asignaturaModel = require('../models/asignaturaModel'); // Para obtener asignaturas de profesor
const db = require('../config/db');

/**
 * Controlador para gestionar operaciones relacionadas con usuarios
 */

/**
 * Obtiene todos los usuarios con paginación
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerTodosLosUsuarios = async (req, res) => {
    try {
        // Solo Admins O Profesores pueden obtener todos los usuarios
        if (!req.user || (req.user.rol !== 'admin' && req.user.rol !== 'profesor')) {
            return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador o profesor.' });
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { rol, nombre, email, dni } = req.query; // Parámetros de filtrado

        const filtros = {};
        if (rol && ['alumno', 'profesor', 'admin'].includes(rol)) filtros.rol = rol;
        if (nombre) filtros.nombre = nombre; // El modelo debería usar LIKE para nombre/apellido
        if (email) filtros.email = email;
        if (dni) filtros.dni = dni;

        const { data, pagination } = await usuarioModel.obtenerTodosPaginado(page, limit, filtros);
        
        res.json({ data: quitarContrasenaDeArray(data), pagination });
    } catch (error) {
        console.error("Error al obtener todos los usuarios:", error);
        res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    }
};

/**
 * Obtiene un usuario por su ID
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuarioIdBuscado = req.params.id;
        // Un admin puede ver cualquier perfil. Un usuario solo el suyo (a menos que se permita otra cosa)
        if (!req.user || (req.user.rol !== 'admin' && req.user.id !== usuarioIdBuscado)) {

        }

        const usuario = await usuarioModel.obtenerPorId(usuarioIdBuscado);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        let respuesta = quitarContrasena(usuario);

        // Enriquecer respuesta según rol y si es el propio usuario o un admin
        if (respuesta.rol === 'alumno') {
            const cursosMatriculado = await cursoModel.obtenerCursosPorAlumnoIdPaginado(usuario.id, 1, 50); // Paginar o limitar
            respuesta.cursos_matriculado = cursosMatriculado.data;
        }
        if (respuesta.rol === 'profesor') {
            const asignaturasAsignadas = await asignaturaModel.obtenerPorProfesorIdPaginado(usuario.id, 1, 50);
            respuesta.asignaturas_asignadas = asignaturasAsignadas.data;
        }
        
        res.json(respuesta);
    } catch (err) {
        console.error('Error al obtener el usuario por ID:', err);
        res.status(500).json({ message: 'Error del servidor al obtener usuario', error: err.message });
    }
};

/**
 * Busca usuarios por nombre
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.buscarUsuarios = async (req, res) => {
    try {
        const searchTerm = req.query.term;
        if (!searchTerm) {
            return res.status(400).json({ message: 'Término de búsqueda requerido' });
        }
        const usuarios = await usuarioModel.obtenerPorNombre(searchTerm); 
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar usuarios', error: error.message });
    }
};

/**
 * Obtiene un usuario por su email
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.getByEmail = async (req, res) => {
    const email = req.params.email;
    try {
        const userInfo = await usuarioModel.getByEmail(email);
        if (!userInfo) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Eliminar la contraseña de la respuesta por seguridad
        delete userInfo.contrasena;
        
        res.json(userInfo);
    } catch (err) {
        console.error('Error al obtener el usuario por email:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

/**
 * Obtiene un usuario por su DNI
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.getByDni = async (req, res) => {
    const dni = req.params.dni;
    try {
        const userInfo = await usuarioModel.getByDni(dni);
        if (!userInfo) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(userInfo);
    } catch (err) {
        console.error('Error al obtener el usuario por DNI:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

/**
 * Obtiene todos los profesores
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerProfesores = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { data, pagination } = await usuarioModel.obtenerTodosProfesorPaginado(page, limit);
        res.json({ data, pagination });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener profesores', error: error.message });
    }
};

/**
 * Obtiene todos los alumnos
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerAlumnos = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const profesorId = req.query.profesorId; // Nuevo parámetro para filtrar por profesor
        
        let resultado;
        
        // Si se proporciona un profesorId, obtener solo los alumnos de sus asignaturas
        if (profesorId) {
            resultado = await usuarioModel.obtenerAlumnosPorProfesorId(profesorId, page, limit);
        } else {
            // Si no hay profesorId, obtener todos los alumnos (solo para administradores)
            if (req.user.rol !== 'admin') {
                return res.status(403).json({ 
                    message: 'Acceso denegado. Se requiere rol de administrador o un profesorId válido.' 
                });
            }
            // Usar obtenerTodosPaginado con filtro de rol 'alumno'
            resultado = await usuarioModel.obtenerTodosPaginado(page, limit, { rol: 'alumno' });
        }
        
        res.json(resultado);
    } catch (error) {
        console.error('Error en obtenerAlumnos:', error);
        res.status(500).json({ 
            message: 'Error al obtener alumnos', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Configuración del JWT - Debería estar en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secretisima_por_defecto';
const JWT_EXPIRES_IN = '1d'; // Ejemplo: 1 día

// --- Funciones Auxiliares ---
disabled_function_generateToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id, rol: usuario.rol, email: usuario.email, nombre: usuario.nombre },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const quitarContrasena = (usuario) => {
    if (usuario) {
        const { contrasena, ...usuarioSinContrasena } = usuario;
        return usuarioSinContrasena;
    }
    return null;
};

const quitarContrasenaDeArray = (usuarios) => {
    if (Array.isArray(usuarios)) {
        return usuarios.map(u => quitarContrasena(u));
    }
    return usuarios;
};

// --- Autenticación ---

exports.registrarUsuario = async (req, res) => {
    try {
        let { dni, nombre, apellido, rol, email, contrasena, fecha_nacimiento, telefono, foto_perfil_url } = req.body;

        if (!dni || !nombre || !apellido || !email || !contrasena) {
            return res.status(400).json({ message: 'DNI, nombre, apellido, email y contraseña son obligatorios.' });
        }

        // Validar formato de email y DNI (simplificado)
        if (!email.includes('@')) {
            return res.status(400).json({ message: 'Formato de email inválido.' });
        }

        // Validar que el rol sea válido
        if (!rol) {
            rol = 'alumno'; // Rol por defecto es 'alumno' si no se especifica
        } else if (!['alumno', 'profesor', 'admin'].includes(rol)) {
            return res.status(400).json({ message: 'Rol especificado no válido.' });
        }

        const existeEmail = await usuarioModel.obtenerPorEmail(email);
        if (existeEmail) {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        const existeDni = await usuarioModel.obtenerPorDni(dni);
        if (existeDni) {
            return res.status(409).json({ message: 'El DNI ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const fecha_ingreso = new Date();

        const nuevoUsuarioData = {
            dni,
            nombre,
            apellido,
            rol,
            email,
            contrasena: hashedPassword,
            fecha_nacimiento: fecha_nacimiento || null,
            fecha_ingreso,
            telefono: telefono || null,
            foto_perfil_url: foto_perfil_url || null,
            // fecha_fin por defecto null
        };

        const nuevoUsuarioId = await usuarioModel.crear(nuevoUsuarioData);
        const usuarioCreado = await usuarioModel.obtenerPorId(nuevoUsuarioId);
        
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente', 
            usuario: quitarContrasena(usuarioCreado) 
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
};

exports.loginUsuario = async (req, res) => {
    try {
        const { email, contrasena } = req.body;
        if (!email || !contrasena) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
        }

        const usuario = await usuarioModel.obtenerPorEmailConContrasena(email);
        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales incorrectas (email no encontrado).' });
        }

        // Verificar que la contraseña del usuario existe y es un string
        if (!usuario.contrasena || typeof usuario.contrasena !== 'string') {
            console.error('Error en login: El hash de contraseña para el usuario ' + usuario.email + ' no es válido o no existe.');
            return res.status(500).json({ message: 'Error interno del servidor: datos de usuario corruptos.' });
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({ message: 'Credenciales incorrectas (contraseña).' });
        }

        // No incluir fecha_fin si es null o pasada, o manejarlo según la lógica de negocio.
        if (usuario.fecha_fin && new Date(usuario.fecha_fin) < new Date()) {
            return res.status(403).json({ message: 'La cuenta de usuario ha expirado o ha sido dada de baja.' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, email: usuario.email, nombre: usuario.nombre },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login exitoso',
            token,
            usuario: quitarContrasena(usuario) // Enviar datos básicos del usuario
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: 'Error en el login', error: error.message });
    }
};

/**
 * Actualiza un usuario existente
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.actualizarUsuario = async (req, res) => {
    try {
        // Si la ruta es /perfil, el ID viene de req.user.id
        // Si la ruta es /usuarios/:id, el ID viene de req.params.id (y es para admin)
        const usuarioIdParaActualizar = req.params.id || req.user.id;
        const datosActualizacion = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }

        // Si no es admin y el ID del token no coincide con el ID a actualizar (caso /usuarios/:id accedido por no-admin)
        if (req.user.rol !== 'admin' && req.user.id !== usuarioIdParaActualizar) {
            return res.status(403).json({ message: 'No tiene permiso para actualizar este perfil.' });
        }
        
        // Si es el propio usuario actualizando su perfil (no admin)
        if (req.user.id === usuarioIdParaActualizar && req.user.rol !== 'admin') {
            delete datosActualizacion.rol;
            delete datosActualizacion.dni;
            delete datosActualizacion.fecha_ingreso;
            delete datosActualizacion.fecha_fin; 
            delete datosActualizacion.contrasena; 
        }
        // Si un admin está actualizando, puede cambiar el rol, pero debe ser válido
        if (req.user.rol === 'admin' && datosActualizacion.rol && !['alumno', 'profesor', 'admin'].includes(datosActualizacion.rol)){
            return res.status(400).json({ message: 'Rol especificado no es válido.' });
        }
        // Un admin no debería cambiar la contraseña aquí, usar la ruta específica
        if (datosActualizacion.contrasena) {
             delete datosActualizacion.contrasena;
        }

        // Validar unicidad si se cambia email o DNI (solo admin puede cambiar DNI)
        if (datosActualizacion.email) {
            const otroUsuarioConEmail = await usuarioModel.obtenerPorEmail(datosActualizacion.email);
            if (otroUsuarioConEmail && Number(otroUsuarioConEmail.id) !== Number(usuarioIdParaActualizar)) {
                return res.status(409).json({ message: 'El nuevo email ya está en uso por otro usuario.' });
            }
        }
        // Solo admin puede cambiar DNI y se valida
        if (req.user.rol === 'admin' && datosActualizacion.dni && datosActualizacion.dni !== (await usuarioModel.obtenerPorId(usuarioIdParaActualizar)).dni) {
            const otroUsuarioConDni = await usuarioModel.obtenerPorDni(datosActualizacion.dni);
            if (otroUsuarioConDni && otroUsuarioConDni.id !== usuarioIdParaActualizar) {
                return res.status(409).json({ message: 'El nuevo DNI ya está en uso por otro usuario.' });
            }
        }

        const actualizado = await usuarioModel.actualizar(usuarioIdParaActualizar, datosActualizacion);

        if (!actualizado) {
            const usuarioActual = await usuarioModel.obtenerPorId(usuarioIdParaActualizar);
            if (!usuarioActual) return res.status(404).json({ message: 'Usuario no encontrado.'});
            return res.status(200).json({ message: 'No se realizaron cambios en el usuario.', usuario: quitarContrasena(usuarioActual) });
        }

        const usuarioModificado = await usuarioModel.obtenerPorId(usuarioIdParaActualizar);
        res.json({ message: 'Usuario actualizado correctamente', usuario: quitarContrasena(usuarioModificado) });

    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        if (err.code === 'ER_DUP_ENTRY' || (err.message && (err.message.includes('DNI ya está en uso') || err.message.includes('email ya está en uso')))) {
            return res.status(409).json({ message: err.message });
        }
        res.status(500).json({ message: 'Error en el servidor al actualizar usuario', error: err.message });
    }
};

/**
 * Actualiza la contraseña de un usuario
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.actualizarContrasenaUsuario = async (req, res) => {
    try {
        // Si la ruta es /perfil/contrasena, el ID es req.user.id
        // Si la ruta es /usuarios/:id/contrasena, el ID es req.params.id (y es para admin)
        const usuarioIdParaActualizar = req.params.id || req.user.id;
        const { contrasenaActual, nuevaContrasena } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }
        if (!nuevaContrasena || nuevaContrasena.length < 6) { 
             return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        const usuario = await usuarioModel.obtenerPorIdConContrasena(usuarioIdParaActualizar);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Si es el propio usuario (no admin) cambiando su contraseña
        if (req.user.id === usuarioIdParaActualizar && req.user.rol !== 'admin') {
            if (!contrasenaActual) {
                return res.status(400).json({ message: 'Se requiere la contraseña actual.' });
            }
            const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
            if (!contrasenaValida) {
                return res.status(401).json({ message: 'Contraseña actual incorrecta' });
            }
        } else if (req.user.rol !== 'admin') {
            // Un no-admin intentando cambiar la contraseña de otro (ruta /usuarios/:id/contrasena)
            return res.status(403).json({ message: 'No tiene permiso para cambiar esta contraseña.' });
        }
        // Si es admin, puede cambiar la contraseña de cualquiera sin la actual (ruta /usuarios/:id/contrasena)
        // O si es admin cambiando su propia contraseña (ruta /perfil/contrasena), también puede.

       
        const actualizado = await usuarioModel.actualizar(usuarioIdParaActualizar, { contrasena: nuevaContrasena });

        if (actualizado) {
            res.json({ message: 'Contraseña actualizada exitosamente' });
        } else {
            res.status(500).json({ message: 'No se pudo actualizar la contraseña.' }); 
        }
    } catch (err) {
        console.error('Error al actualizar la contraseña:', err);
        res.status(500).json({ message: 'Error en el servidor al actualizar contraseña', error: err.message });
    }
};

/**
 * Elimina un usuario
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.eliminarUsuario = async (req, res) => {
    try {
        const usuarioIdAEliminar = req.params.id;

        if (!req.user || req.user.rol !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden eliminar usuarios.' });
        }
        if (req.user.id === usuarioIdAEliminar) {
            return res.status(400).json({ message: 'Un administrador no puede eliminarse a sí mismo.' });
        }

        const usuario = await usuarioModel.obtenerPorId(usuarioIdAEliminar);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado para eliminar.' });
        }

        // Verificaciones de dependencias antes de eliminar (simplificado)
        if (usuario.rol === 'profesor') {
            const asignaturas = await asignaturaModel.obtenerPorProfesorIdPaginado(usuarioIdAEliminar, 1, 1);
            if (asignaturas && asignaturas.pagination.total > 0) {
                return res.status(400).json({ message: 'No se puede eliminar el profesor, tiene asignaturas asignadas.' });
            }
        }
        if (usuario.rol === 'alumno') {
            const cursos = await cursoModel.obtenerCursosPorAlumnoIdPaginado(usuarioIdAEliminar, 1, 1);
            if (cursos && cursos.pagination.total > 0) {
                return res.status(400).json({ message: 'No se puede eliminar el alumno, está matriculado en cursos.' });
            }
            // Faltaría verificar TareaCalificacion si el alumno tiene entregas.
        }
        // Faltaría verificar si el usuario es creador de Tareas, etc.

        const resultado = await usuarioModel.eliminar(usuarioIdAEliminar);
        // El modelo debería manejar errores si no se puede eliminar por FK constraints no cubiertas aquí.

        if (!resultado) {
             // Esto podría pasar si hubo un problema no capturado por las verificaciones o el ID no existía
            return res.status(404).json({ message: 'Usuario no encontrado o no se pudo eliminar.' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        // Manejar errores específicos de FK si el modelo no los previene completamente
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'No se puede eliminar el usuario debido a dependencias existentes (ej. tareas, calificaciones).', detalle: error.message });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar usuario', error: error.message });
    }
};

/**
 * Obtiene todos los cursos en los que está matriculado un alumno
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerCursosDeUsuario = async (req, res) => {
    try {
        // Asumimos que el ID del usuario viene de req.params.id o req.user.id (si es el propio usuario)
        const usuarioId = req.params.id || req.user.id;
        const cursos = await usuarioModel.obtenerCursosAlumno(usuarioId);
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los cursos del usuario', error: error.message });
    }
};

/**
 * Obtener el perfil del usuario autenticado
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.obtenerPerfil = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }
        const usuario = await usuarioModel.obtenerPorId(req.user.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
        }

        let perfil = quitarContrasena(usuario);

        if (perfil.rol === 'alumno') {
            const cursosMatriculado = await cursoModel.obtenerCursosPorAlumnoIdPaginado(req.user.id, 1, 100); // Paginar o limitar
            perfil.cursos_matriculado = cursosMatriculado.data;
            // Aquí se podrían añadir calificaciones, etc.
        }
        if (perfil.rol === 'profesor') {
            const asignaturasAsignadas = await asignaturaModel.obtenerPorProfesorIdPaginado(req.user.id, 1, 100);
            perfil.asignaturas_asignadas = asignaturasAsignadas.data;
            // Aquí se podrían añadir tareas creadas, etc.
        }
        // Para admin, ya tiene toda la info básica. Podría tener links a gestión.

        res.json(perfil);
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
    }
};

/**
 * Actualizar el perfil del usuario autenticado
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.actualizarPerfil = async (req, res) => {
    try {
        // El ID del usuario se obtiene del token JWT
        const usuarioActualizado = await usuarioModel.actualizar(req.user.id, req.body);
        if (!usuarioActualizado) {
            return res.status(404).json({ message: 'Perfil no encontrado o sin cambios necesarios' });
        }
        res.json({ message: 'Perfil actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el perfil', error: error.message });
    }
};

// Mantener búsqueda por email y DNI si son rutas públicas o para admins
// Es importante quitar la contraseña en estas también.

exports.obtenerUsuarioPorEmail = async (req, res) => {
    const email = req.params.email;
    // Considerar quién puede usar esta ruta (¿solo admin?)
    try {
        const usuario = await usuarioModel.obtenerPorEmail(email);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(quitarContrasena(usuario));
    } catch (err) {
        console.error('Error al obtener el usuario por email:', err);
        res.status(500).json({ message: 'Error del servidor al obtener usuario por email', error: err.message });
    }
};

exports.obtenerUsuarioPorDni = async (req, res) => {
    const dni = req.params.dni;
    // Considerar quién puede usar esta ruta (¿solo admin?)
    try {
        const usuario = await usuarioModel.obtenerPorDni(dni);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(quitarContrasena(usuario));
    } catch (err) {
        console.error('Error al obtener el usuario por DNI:', err);
        res.status(500).json({ message: 'Error del servidor al obtener usuario por DNI', error: err.message });
    }
};

// --- Funciones específicas de Rol (ej. obtener mis cursos/asignaturas) ---

exports.obtenerMisCursosMatriculados = async (req, res) => {
    try {
        if (!req.user || req.user.rol !== 'alumno') {
            return res.status(403).json({ message: 'Acceso denegado. Solo para alumnos.' });
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const {data, pagination} = await cursoModel.obtenerCursosPorAlumnoIdPaginado(req.user.id, page, limit);
        res.json({data, pagination});
    } catch (error) {
        console.error("Error al obtener mis cursos matriculados:", error);
        res.status(500).json({ message: 'Error al obtener los cursos del alumno', error: error.message });
    }
};

exports.obtenerMisAsignaturasAsignadas = async (req, res) => {
    try {
        if (!req.user || req.user.rol !== 'profesor') {
            return res.status(403).json({ message: 'Acceso denegado. Solo para profesores.' });
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;

        const {data, pagination} = await asignaturaModel.obtenerPorProfesorIdPaginado(req.user.id, page, limit);
        res.json({data, pagination});
    } catch (error) {
        console.error("Error al obtener mis asignaturas asignadas:", error);
        res.status(500).json({ message: 'Error al obtener las asignaturas del profesor', error: error.message });
    }
};
