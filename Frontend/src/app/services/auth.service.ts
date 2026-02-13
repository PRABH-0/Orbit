import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {

private apiUrl = 'https://localhost:44370/api/auth';


  constructor(private http: HttpClient) {}

  // =====================
  // LOGIN
  // =====================
  async login(email: string, password: string) {
    localStorage.setItem('isLoggedIn', 'true');
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  // =====================
  // REGISTER
  // =====================
  async register(email: string, password: string) {
    return await supabase.auth.signUp({
      email,
      password,
    });
  }
  
async syncUser() {
  try {
    const backendUser = await this.getCurrentUser();
    if (backendUser) return backendUser;
  } catch (e) {
    console.warn('Backend sync failed, using Supabase session');
  }

  // fallback to supabase session
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}


  // =====================
  // GET ACCESS TOKEN
  // =====================
  private async getAuthHeaders(): Promise<HttpHeaders> {
    const { data } = await supabase.auth.getSession();

    const token = data.session?.access_token;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // =====================
  // GET CURRENT USER (api/auth/me)
  // =====================
  async getCurrentUser() {
    const headers = await this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/me`, { headers }).toPromise();
  }

  // =====================
  // LOGOUT (Backend optional)
  // =====================
async logout(router: Router) {
  await supabase.auth.signOut();
  localStorage.clear();
  router.navigate(['/signin']);
}

  // =====================
  // CHECK LOGIN
  // =====================
  async isLoggedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }
}
