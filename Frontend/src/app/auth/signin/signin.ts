import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

declare const google: any;

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css'],
})
export class Signin implements OnInit, AfterViewInit {

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

  ngOnInit() {
    if (localStorage.getItem('token')) {
      this.router.navigate(['/canvas']);
    }
  }

  // 🔵 GOOGLE INITIALIZATION
  ngAfterViewInit() {
    google.accounts.id.initialize({
      client_id: '335253037634-8rvgkdjbb5nr3mh9efsi6kgd8nrt28j6.apps.googleusercontent.com',
      callback: (response: any) => this.handleGoogleLogin(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      {
        theme: 'outline',
        size: 'large',
        width: 300
      }
    );
  }

  handleGoogleLogin(response: any) {
  const idToken = response.credential;

  this.auth.googleLogin({ idToken }).subscribe({
    next: res => {
      this.auth.saveToken(res.accessToken);
      localStorage.setItem('username', res.username);
      localStorage.setItem('userId', res.userId);

      // 🔥 ADD THIS
      if (res.profilePictureUrl) {
        localStorage.setItem('profilePic', res.profilePictureUrl);
      }

      this.router.navigate(['/canvas']);
    }
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

  openAbout(){
    this.router.navigate(['about'])
  }
  login() {
    this.auth.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: res => {
        this.auth.saveToken(res.accessToken);
        localStorage.setItem('username', res.username);
        localStorage.setItem('userId', res.userId);
        if (res.profilePictureUrl) {
      localStorage.setItem('profilePic', res.profilePictureUrl);
    }
        this.router.navigate(['/']);
      },
      error: err => {
        this.error = err.error?.message || 'Invalid email or password';
      }
    });
  }
}
