import { NgIf, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf, NgFor],
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
  @Input() breadcrumbs: any[] = [];
  
  // ===== Outputs =====
  @Output() addFolder = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<void>();
  @Output() openMenu = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() rename = new EventEmitter<void>();
  @Output() breadcrumbClick = new EventEmitter<any>();

  truncateName(name: string, isCurrent: boolean): string {
    const limit = isCurrent ? 20 : 12;
    if (name.length <= limit) return name;
    return name.slice(0, limit - 3) + '...';
  }

  getFullPathToolTip(crumb: any): string {
    if (!this.breadcrumbs) return '';
    const index = this.breadcrumbs.indexOf(crumb);
    if (index === -1) return '';
    return this.breadcrumbs.slice(0, index + 1).map(c => c.name).join(' > ');
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

async onLogout() {
  await this.authService.logout(this.router);
}



  // ===== Clear session and redirect =====
  private clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');

    this.router.navigate(['/signin']);
  }
}
