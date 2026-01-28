import { Routes } from '@angular/router';
import { Signin } from './auth/signin/signin';
import { Canvas } from './canvas/canvas';
import { AuthGuard } from './auth/auth-guard';

export const routes: Routes = [
  { path: 'signin', component: Signin },
  {
    path: '',
    component: Canvas,
    canActivate: [AuthGuard]
  }
];
