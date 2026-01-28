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

  email = '';
  password = '';
  error = '';
maskedPassword = '';
showPassword = false;

  constructor(private router: Router) {}

onPasswordInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const realValue = input.value.replace(/\*/g, '');

  this.password += realValue;
  this.maskedPassword = '*'.repeat(this.password.length);
}

  signIn() {
  this.error = '';

  if (!this.email || !this.password) {
    this.error = 'Please fill all fields';
    return;
  }

  if (this.email === 'p@test.com' && this.password === '123456') {

    localStorage.setItem('token', 'logged-in');

    this.router.navigate(['/']);

  } else {
    this.error = 'Invalid credentials';
  }
}

}
