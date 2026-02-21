import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      await supabase.auth.signOut();
      this.router.navigate(['/signin']);
      return false;
    }

    return true;
  }
}
