import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { supabase } from '../supabase.client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  constructor(private http: HttpClient) {}

  getGoogleDriveFiles() {
    return from(supabase.auth.getSession()).pipe(
      switchMap(({ data }) => {

        const token = data.session?.provider_token;

        if (!token) {
          throw new Error('Google provider token not found');
        }

        return this.http.get<any[]>(
          `${environment.apiBaseUrl}/google-drive/files`,
          {
            headers: {
              'Google-Access-Token': token
            }
          }
        );
      })
    );
  }
}
