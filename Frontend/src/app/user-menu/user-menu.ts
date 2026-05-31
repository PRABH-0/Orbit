import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  @Input() username: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() payment = new EventEmitter<void>();
  @Output() about = new EventEmitter<void>();
  @Output() profile = new EventEmitter<void>();

  closeMenu() {
    this.close.emit();
  }

  aboutPage() {
    this.about.emit();
  }

  profilePage() {
    this.profile.emit();
  }


  logoutUser() {
    this.logout.emit();
  }

  paymentPage() {
    this.payment.emit();
  }
}
