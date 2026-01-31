import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css'],
})
export class Signin {

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

  register() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.auth.register({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.isRegister = false;
        this.password = '';
        this.confirmPassword = '';
      },
      error: err => {
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }

  login() {
  this.auth.login({
    email: this.email,
    password: this.password
  }).subscribe({
    next: res => {
      this.auth.saveToken(res.accessToken);

      // ✅ SAVE USER INFO
      localStorage.setItem('username', res.username);
      localStorage.setItem('userId', res.userId);

      this.router.navigate(['/']);
    },
    error: err => {
      this.error = err.error?.message || 'Invalid email or password';
    }
  });
}

}
