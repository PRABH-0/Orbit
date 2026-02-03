import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'https://localhost:44370/api/auth';

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${this.baseUrl}/login`, data);
  }

  register(data: { username: string; email: string; password: string }) {
    return this.http.post<any>(`${this.baseUrl}/register`, data);
  }

  getUserDetails() {
    return this.http.get<any>(`${this.baseUrl}/userDetails`);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  logout() {
  return this.http.post(`${this.baseUrl}/logout`, {});
}

// auth.service.ts
googleLogin(data: { idToken: string }) {
  return this.http.post<any>(
    `${this.baseUrl}/google-login`, // Changed from '/api/auth/google-login'
    data
  );
}
refreshToken() {
  return this.http.post<any>(
    `${this.baseUrl}/refresh`,
    {},
    { withCredentials: true } // 👈 IMPORTANT (cookie!)
  );
}

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
