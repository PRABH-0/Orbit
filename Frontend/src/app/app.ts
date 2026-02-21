import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Loader } from './shared/loader/loader';
import { supabase } from './supabase.client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,Loader],
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
