import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Loader } from './shared/loader/loader';
import { OrbitToastComponent } from './shared/orbit-toast/orbit-toast';
import { OrbitDialogComponent } from './shared/orbit-dialog/orbit-dialog';
import { supabase } from './supabase.client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Loader, OrbitToastComponent, OrbitDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private router: Router) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      this.router.navigate(['/signin']);
    }
  });
}
}
