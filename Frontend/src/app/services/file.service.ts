import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileService {

  private baseUrl = `${environment.apiBaseUrl}/File`;

  constructor(private http: HttpClient) {}

  getFilesByNode(nodeId: string): Observable<any[]> {
    if (!nodeId || nodeId === 'undefined') return of([]);
    return this.http.get<any[]>(`${this.baseUrl}/node/${nodeId}`);
  }

  uploadFile(nodeId: string, file: File): Observable<any> {
    if (!nodeId || nodeId === 'undefined') return of(null);
    const formData = new FormData();
    formData.append('nodeId', nodeId);
    formData.append('file', file);

    const headers = new HttpHeaders().set('X-Skip-Loader', 'true');

    return this.http.post<any>(
      `${this.baseUrl}/upload`,
      formData,
      {
        headers,
        reportProgress: true,
        observe: 'events'
      }
    );
  }

  downloadFile(fileId: string): Observable<any> {
    if (!fileId || fileId === 'undefined') return of(null);
    return this.http.get(
      `${this.baseUrl}/${fileId}/download`,
      {
        responseType: 'blob',
        observe: 'response'
      }
    );
  }

  deleteFile(fileId: string): Observable<any> {
    if (!fileId || fileId === 'undefined') return of(null);
    return this.http.delete(`${this.baseUrl}/${fileId}`);
  }
}
