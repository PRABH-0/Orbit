import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  @Input() username: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() payment = new EventEmitter<void>();


  closeProfile() {
    this.close.emit();
  }

  logoutUser() {
    this.logout.emit();
  }
  paymentpage(){
    this.payment.emit();
  }
}
