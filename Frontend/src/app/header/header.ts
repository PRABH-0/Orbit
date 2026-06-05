import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
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
  @Input() rootOpen = false;
  @Input() selectedFolderId: string | null = null;
  
  // ===== Outputs =====
  @Output() addFolder = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<void>();
  @Output() openMenu = new EventEmitter<void>();
  @Output() folderSettings = new EventEmitter<void>();
  @Output() breadcrumbClick = new EventEmitter<any>();

  // ===== UI State =====
  isAddMenuOpen = false;
  visibleStart: any[] = [];
  visibleEnd: any[] = [];
  hiddenBreadcrumbs: any[] = [];
  isOverflowHovered = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isAddMenuOpen = false;
    }
  }

  toggleAddMenu(event: Event) {
    event.stopPropagation();
    this.isAddMenuOpen = !this.isAddMenuOpen;
  }

  onAddFolderClick() {
    this.addFolder.emit();
    this.isAddMenuOpen = false;
  }

  onAddItemClick() {
    this.addItem.emit();
    this.isAddMenuOpen = false;
  }

  closeAddMenu() {
    this.isAddMenuOpen = false;
  }

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

    if (this.breadcrumbs.length <= 7) {
      this.visibleStart = this.breadcrumbs;
      this.visibleEnd = [];
      this.hiddenBreadcrumbs = [];
    } else {
      this.visibleStart = this.breadcrumbs.slice(0, 3);
      this.visibleEnd = this.breadcrumbs.slice(-3);
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

  shouldShowBrackets(crumb: any, isActive: boolean): boolean {
    if (crumb.isRoot) {
      return !!this.rootOpen && !this.selectedFolderId;
    }
    return isActive;
  }

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
