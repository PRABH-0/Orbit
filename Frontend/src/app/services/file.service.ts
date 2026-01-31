import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileService {

  private baseUrl = 'https://localhost:44370/api/File';

  constructor(private http: HttpClient) {}

  getFilesByNode(nodeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/node/${nodeId}`);
  }

  uploadFile(nodeId: string, file: File) {
  const formData = new FormData();
  formData.append('nodeId', nodeId);
  formData.append('file', file);

  return this.http.post<any>(
    `${this.baseUrl}/upload`,
    formData
  );
}


 downloadFile(fileId: string) {
  return this.http.get(
    `${this.baseUrl}/${fileId}/download`,
    {
      responseType: 'blob',
      observe: 'response'
    }
  );
}


  deleteFile(fileId: string) {
    return this.http.delete(`${this.baseUrl}/${fileId}`);
  }
}
