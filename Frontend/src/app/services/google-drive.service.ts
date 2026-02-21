import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, switchMap, throwError } from 'rxjs';
import { supabase } from '../supabase.client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  constructor(private http: HttpClient) {}

  getGoogleDriveFiles() {
    return from(
      supabase.auth.getSession()
    ).pipe(
      switchMap(async ({ data, error }) => {

        if (error) {
          console.error('Session error:', error);
          throw error;
        }

        let session = data.session;

        // 🔥 If session missing, try refresh
        if (!session) {
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError || !refreshData.session) {
            throw new Error('Unable to refresh Supabase session');
          }

          session = refreshData.session;
        }

        const token = session.provider_token;

        if (!token) {
          throw new Error('Google provider token not found');
        }

        const headers = new HttpHeaders({
          'Google-Access-Token': token
        });

        return this.http.get<any[]>(
          `${environment.apiBaseUrl}/google-drive/files`,
          { headers }
        ).toPromise();
      })
    );
  }

  downloadGoogleFile(fileId: string) {
    return from(
      supabase.auth.getSession()
    ).pipe(
      switchMap(async ({ data }) => {

        const token = data.session?.provider_token;

        if (!token) {
          throw new Error('Google provider token missing');
        }

        const headers = new HttpHeaders({
          'Google-Access-Token': token
        });

        return this.http.get(
          `${environment.apiBaseUrl}/google-drive/file/${fileId}`,
          {
            headers,
            observe: 'response',
            responseType: 'blob'
          }
        ).toPromise();
      })
    );
  }
}