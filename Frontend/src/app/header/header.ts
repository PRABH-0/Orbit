import { NgIf, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnChanges {

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
  @Output() folderSettings = new EventEmitter<void>();
  @Output() breadcrumbClick = new EventEmitter<any>();

  // ===== Breadcrumb Overflow State =====
  visibleStart: any[] = [];
  visibleEnd: any[] = [];
  hiddenBreadcrumbs: any[] = [];
  isOverflowHovered = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['breadcrumbs']) {
      this.updateBreadcrumbs();
    }
  }

  updateBreadcrumbs() {
    if (!this.breadcrumbs || this.breadcrumbs.length === 0) {
      this.visibleStart = [];
      this.visibleEnd = [];
      this.hiddenBreadcrumbs = [];
      return;
    }

    // Threshold for collapsing: 
    // If we have more than 7 items, we collapse the middle.
    // Example: 1 > 2 > 3 > 4 > 5 > 6 > 7 (Show all)
    // 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8 (Collapse: 1 > 2 > 3 > [ ... ] > 6 > 7 > 8)
    if (this.breadcrumbs.length <= 7) {
      this.visibleStart = this.breadcrumbs;
      this.visibleEnd = [];
      this.hiddenBreadcrumbs = [];
    } else {
      // Keep first 3
      this.visibleStart = this.breadcrumbs.slice(0, 3);
      // Keep last 3 (including current)
      this.visibleEnd = this.breadcrumbs.slice(-3);
      // Everything else is hidden
      this.hiddenBreadcrumbs = this.breadcrumbs.slice(3, -3);
    }
  }

  onBreadcrumbClick(crumb: any, isLast: boolean) {
    if (isLast && this.currentFolder !== 'Root') {
      this.folderSettings.emit();
    } else {
      this.breadcrumbClick.emit(crumb);
    }
  }

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
