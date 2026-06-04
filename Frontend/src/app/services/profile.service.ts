import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ========================
// Response Interfaces
// ========================

export interface StorageUsage {
  usedBytes: number;
  totalBytes: number;
  usagePercentage: number;
}

export interface AccountStats {
  totalFolders: number;
  totalFiles: number;
  planName: string;
}

export interface ProfileResponse {
  id: string;
  username: string;
  email: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  userStatus: string;
  isAdmin: boolean;
  storage: StorageUsage;
  stats: AccountStats;
}

// ========================
// Service
// ========================

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private baseUrl = `${environment.apiBaseUrl}/profile`;

  constructor(private http: HttpClient) {}

  /**
   * Fetches the full profile for the authenticated user.
   * JWT token is attached automatically by the supabase-auth interceptor.
   */
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/me`);
  }
}
