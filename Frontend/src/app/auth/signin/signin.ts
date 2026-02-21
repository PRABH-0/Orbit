import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { supabase } from '../../supabase.client';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, NgStyle],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css'],
})
export class Signin implements OnInit {

  isRegister = false;
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  error = '';


  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

async ngOnInit() {
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    this.router.navigateByUrl('/canvas');
  }
}

async googleLogin() {

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/canvas',
      scopes: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
    },
  });

  if (!error) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('role', 'user'); // default role
  }
}

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
    this.password = '';
    this.confirmPassword = '';
  }

  submit() {
    this.error = '';

    if (!this.email || !this.password || (this.isRegister && !this.username)) {
      this.error = 'Please fill all fields';
      return;
    }

    this.isRegister ? this.register() : this.login();
  }

  async register() {
  if (this.password !== this.confirmPassword) {
    this.error = 'Passwords do not match';
    return;
  }

  const { error } = await this.auth.register(
    this.email,
    this.password
  );

  if (error) {
    this.error = error.message;
  } else {
    this.isRegister = false;
    this.password = '';
    this.confirmPassword = '';
    alert('Check your email to confirm your account');
  }
}


  openAbout(){
    this.router.navigate(['about'])
  }
async login() {
  this.error = '';

  const { error, data } = await this.auth.login(
    this.email,
    this.password
  );

  if (error) {
    this.error = error.message;
    return;
  }

  // Supabase stores session automatically
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('email', data.user.email || '');

  this.router.navigate(['/canvas']);
}


}
