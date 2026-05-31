import { Routes } from '@angular/router';
import { Signin } from './auth/signin/signin';
import { Canvas } from './canvas/canvas';
import { AuthGuard } from './auth/auth-guard';
import { Payment } from './payment/payment';
import { About } from './about/about';
import { ProfileSettings } from './profile-settings/profile-settings';

export const routes: Routes = [

  {
    path: 'signin',
    component: Signin
  },

  {
    path: 'canvas',
    component: Canvas,
    canActivate: [AuthGuard]
  },
  {
    path:'payment',
    component:Payment,
  },
  {
    path:'about',
    component:About,
  },
  {
    path:'profile',
    component:ProfileSettings,
    canActivate: [AuthGuard]
  },

  {
    path: '',
    redirectTo: 'canvas',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'signin'
  }
];
