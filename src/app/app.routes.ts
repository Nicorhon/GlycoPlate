import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'camera',
    loadComponent: () =>
      import('./pages/camera/camera.page').then(m => m.CameraPage),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.page').then(m => m.HistoryPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.page').then(m => m.ProfilePage),
  },
];