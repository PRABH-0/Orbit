import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private baseUrl = `${environment.apiBaseUrl}/Node`;

  constructor(private http: HttpClient) {}

  // Get all directories (nodes)
  getDirectories() {
    return this.http.get<any[]>(this.baseUrl);
  }

  // Create directory
  createDirectory(data: {
    name: string;
    x: number;
    y: number;
    parentId?: string | null;
    basePath?: string | null;
  }) {
    return this.http.post<any>(this.baseUrl, data);
  }

  // Update directory position
  updatePosition(directoryId: string, x: number, y: number) {
    return this.http.put(
      `${this.baseUrl}/${directoryId}/position`,
      { x, y }
    );
  }

  // Delete directory
  deleteDirectory(directoryId: string) {
    return this.http.delete(
      `${this.baseUrl}/${directoryId}`
    );
  }

  // Get single directory
  getDirectoryById(directoryId: string) {
    return this.http.get<any>(
      `${this.baseUrl}/${directoryId}`
    );
  }
}
