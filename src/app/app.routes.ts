import { Routes } from '@angular/router';
import { TabsPage } from './pages/tabs/tabs.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage),
  },
  {
    path: 'camera', // Keep camera outside tabs if you want it full-screen
    loadComponent: () => import('./pages/camera/camera.page').then(m => m.CameraPage),
  },
  {
    path: 'tabs',
    component: TabsPage, // The wrapper
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/history/history.page').then(m => m.HistoryPage),
      },
      {
       path: 'suggestions',
        loadComponent: () => import('./pages/suggestions/suggestions.page').then(m => m.SuggestionsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: '/tabs/history',
        pathMatch: 'full',
      },
    ],
  },
];