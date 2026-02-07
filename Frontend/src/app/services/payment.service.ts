import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private baseUrl = 'https://localhost:44370/api/payments';

  constructor(private http: HttpClient) {}

  createPayment(plan: 'pro' | 'ultra') {
    return this.http.post<any>(
      `${this.baseUrl}/create`,
      { plan }
    );
  }

  verifyPayment(paymentId: string, gatewayPaymentId: string) {
    return this.http.post(
      `${this.baseUrl}/verify`,
      { paymentId, gatewayPaymentId }
    );
  }
}
