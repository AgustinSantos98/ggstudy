-- Inicialización de la base de datos para GgStudy
-- Este script crea todas las tablas necesarias según el modelo de datos definido

-- Asegurarse de usar la base de datos correcta
USE ggstudy;

-- Eliminar tablas respetando dependencias de foreign keys
DROP TABLE IF EXISTS tarea_calificacion;
DROP TABLE IF EXISTS tarea;
DROP TABLE IF EXISTS tema;
DROP TABLE IF EXISTS asignatura;
DROP TABLE IF EXISTS curso_usuario;
DROP TABLE IF EXISTS curso_profesor;
DROP TABLE IF EXISTS curso;
DROP TABLE IF EXISTS usuarios;

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol ENUM('alumno', 'profesor', 'admin') NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    fecha_ingreso DATE,
    fecha_fin DATE,
    telefono VARCHAR(20),
    foto_perfil_url VARCHAR(255)
);

-- Tabla de Cursos
CREATE TABLE curso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla de relación Curso-Profesor (muchos a muchos)
CREATE TABLE curso_profesor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES curso(id) ON DELETE CASCADE,
    UNIQUE KEY unique_curso_profesor (usuario_id, curso_id)
);

-- Tabla de relación Curso-Alumno (muchos a muchos)
CREATE TABLE curso_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha_matriculacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES curso(id) ON DELETE CASCADE,
    UNIQUE KEY unique_curso_alumno (usuario_id, curso_id)
);

-- Tabla de Asignatura
DROP TABLE IF EXISTS asignatura;
CREATE TABLE asignatura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso_id INT NOT NULL,
    profesor_id INT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    FOREIGN KEY (curso_id) REFERENCES curso(id) ON DELETE CASCADE,
    FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de Temas (unidades dentro de una asignatura)
DROP TABLE IF EXISTS tema;
CREATE TABLE tema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asignatura_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    FOREIGN KEY (asignatura_id) REFERENCES asignatura(id) ON DELETE CASCADE
);

-- Tabla de Tareas
DROP TABLE IF EXISTS tarea;
CREATE TABLE tarea (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tema_id INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_entrega DATE,
    visible BOOLEAN DEFAULT TRUE,
    archivo VARCHAR(255),
    creado_por INT NOT NULL,
    FOREIGN KEY (tema_id) REFERENCES tema(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- Tabla de Calificaciones de Tareas
DROP TABLE IF EXISTS tarea_calificacion;
CREATE TABLE tarea_calificacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tarea_id INT NOT NULL,
    url VARCHAR(255),
    texto TEXT,
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calificacion DECIMAL(5,2),
    feedback TEXT,
    corregido_por INT,
    fecha_correccion TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tarea_id) REFERENCES tarea(id) ON DELETE CASCADE,
    FOREIGN KEY (corregido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);
