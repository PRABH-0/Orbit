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


  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
