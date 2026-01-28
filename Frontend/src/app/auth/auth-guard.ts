import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {

    const isLoggedIn = localStorage.getItem('token'); 
    // OR sessionStorage / service variable

    if (isLoggedIn) {
      return true; // allow access
    }

    this.router.navigate(['/signin']);
    return false; // block access
  }
}
