const fs = require('fs');
const path = require('path');
const mysql2 = require('mysql2');
const bcrypt = require('bcrypt');

/**
 * Script para ejecutar la migración inicial de la base de datos
 * Este script limpia la base de datos y la inicializa desde cero,
 * creando todas las tablas necesarias y los usuarios de prueba
 */

console.log('Iniciando migración de la base de datos...');

// Importar configuración desde db.js pero no usar la conexión
const db = require('../config/db');
// Extraer configuración de la conexión existente
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};


// Crear una conexión específica para migraciones que permita múltiples consultas
const migrationConnection = mysql2.createConnection({
  ...dbConfig,
  multipleStatements: true  // Esta opción permite ejecutar múltiples consultas SQL
});

// Conectar a la base de datos
migrationConnection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Ejecutar las consultas SQL para crear tablas
  migrationConnection.query(sql, (err) => {
    if (err) {
      console.error('Error al ejecutar la migración:', err);
      process.exit(1);
    }
    
    console.log('Tablas creadas correctamente.');
    
    // Paso 3: Crear usuarios de prueba
    createTestUsers(migrationConnection);
  });
});

/**
 * Crea usuarios de prueba para desarrollo y testing
 */
async function createTestUsers(connection) {
  console.log('Creando usuarios de prueba...');

  // Administradores
  const admins = [
    { 
      nombre: 'Carlos', 
      apellido: 'Rodríguez Gómez', 
      dni: '10000003C', 
      email: 'admin1@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'admin',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?admin1'
    }
  ];

  // Profesores con nombres españoles realistas
  const profesores = [
    { 
      nombre: 'María', 
      apellido: 'García López', 
      dni: '20000001B', 
      email: 'maria.garcia@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'profesor',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?profesor1'
    },
    { 
      nombre: 'Antonio', 
      apellido: 'Fernández Martínez', 
      dni: '20000002C', 
      email: 'antonio.fernandez@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'profesor',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?profesor2'
    },
    { 
      nombre: 'Laura', 
      apellido: 'Sánchez Ruiz', 
      dni: '20000003D', 
      email: 'laura.sanchez@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'profesor',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?profesor3'
    }
  ];

  // Alumnos con nombres españoles realistas
  const alumnos = [
    { 
      nombre: 'Pablo', 
      apellido: 'Martín Jiménez', 
      dni: '30000001A', 
      email: 'pablo.martin@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno1'
    },
    { 
      nombre: 'Lucía', 
      apellido: 'Pérez Díaz', 
      dni: '30000002B', 
      email: 'lucia.perez@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno2'
    },
    { 
      nombre: 'Javier', 
      apellido: 'López González', 
      dni: '30000003C', 
      email: 'javier.lopez@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno3'
    },
    { 
      nombre: 'Carmen', 
      apellido: 'Hernández Moreno', 
      dni: '30000004D', 
      email: 'carmen.hernandez@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno4'
    },
    { 
      nombre: 'Daniel', 
      apellido: 'Muñoz Álvarez', 
      dni: '30000005E', 
      email: 'daniel.munoz@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno5'
    },
    { 
      nombre: 'Sara', 
      apellido: 'Romero Gutiérrez', 
      dni: '30000006F', 
      email: 'sara.romero@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno6'
    },
    { 
      nombre: 'Alejandro', 
      apellido: 'Alonso Navarro', 
      dni: '30000007G', 
      email: 'alejandro.alonso@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno7'
    },
    { 
      nombre: 'Marta', 
      apellido: 'Torres Vega', 
      dni: '30000008H', 
      email: 'marta.torres@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno8'
    },
    { 
      nombre: 'David', 
      apellido: 'Gil Serrano', 
      dni: '30000009I', 
      email: 'david.gil@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno9'
    },
    { 
      nombre: 'Elena', 
      apellido: 'Ramírez Castro', 
      dni: '30000010J', 
      email: 'elena.ramirez@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno10'
    },
    { 
      nombre: 'Miguel', 
      apellido: 'Suárez Ortega', 
      dni: '30000011K', 
      email: 'miguel.suarez@ggstudy.com', 
      contrasena: 'test1234', 
      rol: 'alumno',
      foto_perfil_url: 'https://thispersondoesnotexist.com/?alumno11'
    }
  ];

  // Combinar todos los usuarios
  const users = [...admins, ...profesores, ...alumnos];

  // Objetos para almacenar los IDs de los usuarios creados
  const userIds = {
    admins: [],
    profesores: [],
    alumnos: []
  };

  // Promisificar la inserción de usuarios para poder esperar a que termine
  const insertUsers = () => {
    return Promise.all(users.map(user => {
      return new Promise(async (resolve, reject) => {
        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.contrasena, salt);

        // Insertar usuario
        const insertQuery = `
          INSERT INTO usuarios (dni, nombre, apellido, rol, email, contrasena, fecha_ingreso, foto_perfil_url)
          VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)
        `;

        connection.query(
          insertQuery,
          [user.dni, user.nombre, user.apellido, user.rol, user.email, hashedPassword, user.foto_perfil_url],
          (err, results) => {
            if (err) {
              console.error(`Error al crear usuario ${user.email}:`, err);
              reject(err);
            } else {
              console.log(`Usuario ${user.rol} creado: ${user.email} (ID: ${results.insertId})`);
              // Guardar el ID del usuario según su rol para usarlo después
              if (user.rol === 'admin') {
                userIds.admins.push(results.insertId);
              } else if (user.rol === 'profesor') {
                userIds.profesores.push(results.insertId);
              } else if (user.rol === 'alumno') {
                userIds.alumnos.push(results.insertId);
              }
              resolve(results.insertId);
            }
          }
        );
      });
    }));
  };

  try {
    // Crear los usuarios y esperar a que termine
    await insertUsers();
    
    console.log('Creando cursos, asignaturas, temas y tareas de prueba...');
    
    const cursosData = [
      { 
        nombre: 'DAW - 1er Curso', 
        descripcion: 'Primer año del Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Web',
        asignaturas: [
          { nombre: 'Sistemas Informáticos', descripcion: 'Fundamentos de hardware, software y sistemas operativos.', temas: ['Introducción a SI', 'Redes Locales'] },
          { nombre: 'Bases de Datos', descripcion: 'Diseño y gestión de bases de datos relacionales y NoSQL.', temas: ['Modelo Entidad-Relación', 'SQL Básico'] }
        ]
      },
      { 
        nombre: 'DAW - 2do Curso', 
        descripcion: 'Segundo año del Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Web',
        asignaturas: [
          { nombre: 'Desarrollo Web en Entorno Cliente', descripcion: 'Desarrollo de aplicaciones web interactivas con JavaScript y frameworks.', temas: ['DOM y Eventos', 'JavaScript Avanzado'] },
          { nombre: 'Desarrollo Web en Entorno Servidor', descripcion: 'Desarrollo de APIs y lógica de backend.', temas: ['Node.js y Express', 'APIs RESTful'] }
        ]
      }
    ];
    
    // Dividir a los alumnos en dos grupos
    const mitad = Math.ceil(userIds.alumnos.length / 2);
    const alumnosGrupo1 = userIds.alumnos.slice(0, mitad);
    const alumnosGrupo2 = userIds.alumnos.slice(mitad);

    // Recorremos los cursos
    for (let i = 0; i < cursosData.length; i++) {
      const cursoData = cursosData[i];
      // Insertar Curso
      const insertCursoQuery = `INSERT INTO curso (nombre, descripcion) VALUES (?, ?)`;
      const [cursoResult] = await connection.promise().query(insertCursoQuery, [cursoData.nombre, cursoData.descripcion]);
      const cursoId = cursoResult.insertId;
      console.log(`Curso creado: ${cursoData.nombre} (ID: ${cursoId})`);

      // Asignar profesores al curso
      for (const profesorId of userIds.profesores) {
        const insertProfesorCursoQuery = `INSERT INTO curso_profesor (usuario_id, curso_id) VALUES (?, ?)`;
        await connection.promise().query(insertProfesorCursoQuery, [profesorId, cursoId]);
        console.log(`Profesor (ID: ${profesorId}) asignado al curso: ${cursoData.nombre}`);
      }
      
      // Determinar qué grupo de alumnos matricular
      const alumnosGrupo = i === 0 ? alumnosGrupo1 : alumnosGrupo2;

      // Matricular alumnos en el curso
      for (const alumnoId of alumnosGrupo) {
        const insertAlumnoCursoQuery = `INSERT INTO curso_usuario (usuario_id, curso_id) VALUES (?, ?)`;
        await connection.promise().query(insertAlumnoCursoQuery, [alumnoId, cursoId]);
        console.log(`Alumno (ID: ${alumnoId}) matriculado en el curso: ${cursoData.nombre}`);
      }

      for (const asignaturaData of cursoData.asignaturas) {
        // Insertar Asignatura
        const insertAsignaturaQuery = `
          INSERT INTO asignatura (curso_id, profesor_id, nombre, descripcion) 
          VALUES (?, ?, ?, ?)
        `;
        // Asignar un profesor aleatorio a la asignatura
        const profesorIndex = Math.floor(Math.random() * userIds.profesores.length);
        const profesorId = userIds.profesores[profesorIndex];
        
        const [asignaturaResult] = await connection.promise().query(insertAsignaturaQuery, [
          cursoId,
          profesorId, // Asignamos un profesor aleatorio a la asignatura
          asignaturaData.nombre,
          asignaturaData.descripcion
        ]);
        const asignaturaId = asignaturaResult.insertId;
        console.log(`  Asignatura creada: ${asignaturaData.nombre} (ID: ${asignaturaId}) para el curso ID: ${cursoId}, Profesor ID: ${profesorId}`);

        for (const temaNombre of asignaturaData.temas) {
          // Insertar Tema
          const insertTemaQuery = `INSERT INTO tema (asignatura_id, nombre) VALUES (?, ?)`;
          const [temaResult] = await connection.promise().query(insertTemaQuery, [asignaturaId, temaNombre]);
          const temaId = temaResult.insertId;
          console.log(`    Tema creado: ${temaNombre} (ID: ${temaId}) para la asignatura ID: ${asignaturaId}`);

          // Crear una tarea de ejemplo para cada tema
          const tarea = {
            titulo: `Tarea de ${temaNombre}`,
            descripcion: `Realiza la actividad práctica relacionada con ${temaNombre} de la asignatura ${asignaturaData.nombre}.`,
            fecha_entrega: new Date(new Date().setDate(new Date().getDate() + 14)) // Entrega en 2 semanas
          };
          
          // Seleccionar un profesor aleatorio para el campo creado_por
          const profesorIndex = Math.floor(Math.random() * userIds.profesores.length);
          const profesorId = userIds.profesores[profesorIndex];

          const insertTareaQuery = `
            INSERT INTO tarea (tema_id, titulo, descripcion, fecha_entrega, visible, creado_por) 
            VALUES (?, ?, ?, ?, TRUE, ?)
          `;
          await connection.promise().query(insertTareaQuery, [
            temaId,
            tarea.titulo,
            tarea.descripcion,
            tarea.fecha_entrega,
            profesorId // Usar el ID del profesor seleccionado
          ]);
          console.log(`      Tarea creada: "${tarea.titulo}" para el tema ID: ${temaId}`);
        }
      }
    }
    
    console.log('Migración completada exitosamente.');
    connection.end();
    
  } catch (error) {
    console.error('Error durante la migración:', error);
    connection.end();
  }
}