import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {

private apiUrl = 'https://localhost:44370/api/auth';


  constructor(private http: HttpClient) {}

  // =====================
  // LOGIN
  // =====================
  async login(email: string, password: string) {
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
// =====================
// SYNC USER WITH BACKEND
// =====================
async syncUser() {
  try {
    return await this.getCurrentUser();
  } catch (error) {
    console.error('User sync failed', error);
    throw error;
  }
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
  async logout() {
    await supabase.auth.signOut();
  }

  // =====================
  // CHECK LOGIN
  // =====================
  async isLoggedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }
}
