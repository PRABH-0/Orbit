import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { supabase } from '../../supabase.client';

declare const google: any;

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, NgIf],
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
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/canvas',
    },
  });
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
