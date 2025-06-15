import { Routes } from '@angular/router';
import { LoginComponent } from './authentication/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ProfesorGuard } from './core/guards/profesor.guard';
import { AlumnoGuard } from './core/guards/alumno.guard';
import { AdminComponent } from './dashboard/admin/admin.component';

import { ProfesoresComponent } from './dashboard/admin/profesores/profesores.component';
import { CursosAdminComponent } from './dashboard/admin/cursos/cursos.component';

import { PerfilComponent } from './dashboard/perfil/perfil.component';
import { AsignaturasComponent } from './dashboard/admin/asignaturas/asignaturas.component';
import { TemasComponent } from './dashboard/admin/temas/temas.component';
import { TareasComponent } from './dashboard/admin/tareas/tareas.component';
import { ProfesorComponent } from './dashboard/profesor/profesor.component';
import { AlumnosComponent } from './dashboard/admin/alumnos/alumnos.component';
import { EntregasTareasComponent } from './dashboard/profesor/entregas-tareas/entregas-tareas.component';
import { CalificarEntregaComponent } from './dashboard/profesor/calificar-entrega/calificar-entrega.component';

// Componentes del panel de alumno
import { AlumnoComponent } from './dashboard/alumno/alumno.component';
import { MiCursoComponent } from './dashboard/alumno/mi-curso/mi-curso.component';
import { MisAsignaturasComponent } from './dashboard/alumno/mis-asignaturas/mis-asignaturas.component';
import { MisTemasComponent } from './dashboard/alumno/mis-temas/mis-temas.component';
import { MisEntregablesComponent } from './dashboard/alumno/mis-entregables/mis-entregables.component';
import { DetalleEntregaComponent } from './dashboard/alumno/detalle-entrega/detalle-entrega.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/perfil',
    component: PerfilComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/admin',
    component: AdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/admin/alumnos',
    component: AlumnosComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/admin/profesores',
    component: ProfesoresComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/admin/cursos',
    component: CursosAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/admin/asignaturas',
    component: AsignaturasComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/admin/temas',
    component: TemasComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/admin/tareas',
    component: TareasComponent,
    canActivate: [AuthGuard]
  },
  // Rutas para el panel de profesor
  {
    path: 'dashboard/profesor',
    component: ProfesorComponent,
    canActivate: [ProfesorGuard]
  },
  {
    path: 'dashboard/profesor/asignaturas',
    component: AsignaturasComponent,
    canActivate: [ProfesorGuard]
  },
  {
    path: 'dashboard/profesor/temas',
    component: TemasComponent,
    canActivate: [ProfesorGuard]
  },
  {
    path: 'dashboard/profesor/tareas',
    component: TareasComponent,
    canActivate: [ProfesorGuard]
  },
  {
    path: 'dashboard/profesor/entregas-tareas',
    component: EntregasTareasComponent,
    canActivate: [ProfesorGuard]
  },
  {
    path: 'dashboard/profesor/calificar-entrega/:id',
    component: CalificarEntregaComponent,
    canActivate: [ProfesorGuard]
  },
  // Rutas para el panel de alumno
  {
    path: 'dashboard/alumno',
    component: AlumnoComponent,
    canActivate: [AlumnoGuard]
  },
  {
    path: 'dashboard/alumno/mi-curso',
    component: MiCursoComponent,
    canActivate: [AlumnoGuard]
  },
  {
    path: 'dashboard/alumno/mis-asignaturas',
    component: MisAsignaturasComponent,
    canActivate: [AlumnoGuard]
  },
  {
    path: 'dashboard/alumno/mis-temas',
    component: MisTemasComponent,
    canActivate: [AlumnoGuard]
  },
  {
    path: 'dashboard/alumno/mis-entregables',
    component: MisEntregablesComponent,
    canActivate: [AlumnoGuard]
  },
  {
    path: 'dashboard/alumno/detalle-entrega/:id',
    component: DetalleEntregaComponent,
    canActivate: [AlumnoGuard]
  },
  // Redirigir a la página de inicio para cualquier ruta desconocida
  { path: '**', redirectTo: 'login' }
];
