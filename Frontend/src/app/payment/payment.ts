import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-payment',
  imports: [],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment {

 constructor(
   private paymentService: PaymentService,
   private router:Router,
   private toastService: ToastService
 ) {}

purchase(plan: 'pro' | 'ultra') {
  this.paymentService.createPayment(plan).subscribe({
    next: (res) => {
      console.log('Payment created:', res);

      // TEMP simulation (until Razorpay)
      this.paymentService.verifyPayment(
        res.paymentId,
        'fake_gateway_payment_id'
      ).subscribe(() => {
        this.toastService.success('Payment successful! Storage upgraded.');
      });
    },
    error: () => this.toastService.error('Payment failed')
  });
}

   goBack() {
    this.router.navigate(['/canvas']);
  }
}
