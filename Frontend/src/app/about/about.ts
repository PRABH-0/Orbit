import { CommonModule, NgIf } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FeedbackService } from '../services/feedback.service';
import { HttpClientModule } from '@angular/common/http';
import { supabase } from '../supabase.client';
import { AuthService } from '../services/auth.service';
import { NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { ToastService } from '../services/toast.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-about',
  imports: [FormsModule,CommonModule,HttpClientModule],
  templateUrl: './about.html',
  standalone: true,
  styleUrl: './about.css',
})

export class About implements OnInit {
  constructor(
    private router: Router,
    private ngZone: NgZone,
    private feedbackService: FeedbackService,
    private authService : AuthService,
    private location : Location,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  showFeedback = false;
  feedbackType = 'General Feedback';
  feedbackMessage = '';
  isLoggedIn = false;
  isSending = false;

ngOnInit() {
  this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  this.route.queryParams.subscribe(params => {
    if (params['feedback'] === 'true') {
      this.openFeedback();
    }
  });
}

  openFeedback() {
    this.showFeedback = true;
  }

  closeFeedback() {
    this.showFeedback = false;
  }

  sendFeedback() {
    if (!this.feedbackMessage.trim()) return;

    this.isSending = true;

    const payload = {
      type: this.feedbackType,
      message: this.feedbackMessage
    };

    this.feedbackService.sendFeedback(payload).subscribe({
      next: () => {
        this.toastService.success('Feedback Sent Successfully');
        this.feedbackMessage = '';
        this.isSending = false;
        this.closeFeedback();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Failed to send feedback');
        this.isSending = false;
      }
    });
  }

  redirectToLastUrl() {
    this.location.back()
  }
}

