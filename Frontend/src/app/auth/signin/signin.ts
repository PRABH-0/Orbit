import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

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
  password = '';
  confirmPassword = '';
  showPassword = false;
  error = '';

  constructor(private router: Router) {}

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.error = '';
    this.password = '';
    this.confirmPassword = '';
  }

  submit() {
    this.error = '';

    if (!this.username || !this.password) {
      this.error = 'Please fill all fields';
      return;
    }

    if (this.isRegister) {
      this.register();
    } else {
      this.login();
    }
  }

  register() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (users[this.username]) {
      this.error = 'User already exists';
      return;
    }

    users[this.username] = this.password;
    localStorage.setItem('users', JSON.stringify(users));

    this.isRegister = false;
    this.password = '';
    this.confirmPassword = '';
  }

  login() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (users[this.username] === this.password) {
      localStorage.setItem('token', 'logged-in');
      localStorage.setItem('user', this.username);
      this.router.navigate(['/']);
    } else {
      this.error = 'Invalid username or password';
    }
  }
}
