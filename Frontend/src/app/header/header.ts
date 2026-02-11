import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

  // ===== Inputs =====
  @Input() currentFolder: string | null = null;
  @Input() username: string | null = null;
  @Input() x!: number;
  @Input() y!: number;
  @Input() showActions = true;
@Input() userState : any;
  // ===== Outputs =====
  @Output() addFolder = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<void>();
  @Output() openProfile = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

async onLogout() {
  try {
    await this.authService.logout();
  } finally {
    this.clearSession();
  }
}


  // ===== Clear session and redirect =====
  private clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');

    this.router.navigate(['/signin']);
  }
}
