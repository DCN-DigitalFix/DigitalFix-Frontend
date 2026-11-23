import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './auth/role-guard';
import { ROLES } from '../environments/environments';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },
  {
    path: 'dashboard',
    canActivate: [MsalGuard],
    loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'workorders',
    canActivate: [MsalGuard, roleGuard(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CLIENTE, ROLES.AUDITOR)],
    loadComponent: () => import('./pages/workorders').then((m) => m.WorkOrders),
  },
  {
    path: 'catalog',
    canActivate: [MsalGuard, roleGuard(ROLES.ADMIN, ROLES.SUPERVISOR)],
    loadComponent: () => import('./pages/catalog').then((m) => m.Catalog),
  },
  {
    path: 'reports',
    canActivate: [MsalGuard, roleGuard(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.AUDITOR)],
    loadComponent: () => import('./pages/reports').then((m) => m.Reports),
  },
  {
    path: 'audit',
    canActivate: [MsalGuard, roleGuard(ROLES.ADMIN, ROLES.AUDITOR)],
    loadComponent: () => import('./pages/audit').then((m) => m.Audit),
  },
  {
    path: 'kafka-admin',
    canActivate: [MsalGuard, roleGuard(ROLES.ADMIN)],
    loadComponent: () => import('./pages/kafka-admin').then((m) => m.KafkaAdmin),
  },
  {
    path: 'profile',
    canActivate: [MsalGuard],
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden').then((m) => m.Forbidden),
  },
  { path: '**', redirectTo: '' },
];
