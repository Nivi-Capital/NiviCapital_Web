import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout';
import { authguardChildGuard, authguardGuard } from './core/guards/authguard-guard';

export const routes: Routes = [

  {
    path: '',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },
  {

    path: '',
    component: Layout,
    canActivate: [authguardGuard],
    canActivateChild: [authguardChildGuard],

    children: [
      {
        path: 'systemdesign',
        loadChildren: () => import('./features/systemdesign/systemdesign-module').then(m => m.SystemdesignModule)
      },
      //  { path: '', redirectTo: 'systemdesign/buttons', pathMatch: 'full' }, //by default 
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin-module').then(m => m.AdminModule),
      },
      
      { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' }, //by default 
    ]
  },
{
  path:'loanform',
  canActivate: [authguardGuard],
canActivateChild: [authguardChildGuard],
  loadChildren: () => import('./features/admin/loanform/loanform-module').then(m => m.LoanformModule)

},




];
