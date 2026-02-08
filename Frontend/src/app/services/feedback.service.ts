import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private baseUrl = `${environment.apiBaseUrl}/feedback`;

  constructor(private http: HttpClient) {}

  sendFeedback(data: { type: string; message: string }) {
    return this.http.post<any>(this.baseUrl, data);
  }
}
