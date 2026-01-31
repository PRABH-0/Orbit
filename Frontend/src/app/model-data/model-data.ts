import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-model-data',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './model-data.html',
  styleUrl: './model-data.css',
})
export class ModelData implements OnChanges {

  @Input() x!: number;
  @Input() y!: number;

  @Input() title : string|null = '';

  // Files are NOT implemented yet → keep safe defaults
  @Input() items: string[] = [];
  @Input() basePath: string | null = null;

  @Output() closeNode = new EventEmitter<void>();
  @Output() addImage = new EventEmitter<File>();
  @Output() imageOpen = new EventEmitter<string>();

  pageSize = 70;
  currentPage = 0;

  // =========================
  // UI Actions
  // =========================
  close() {
    this.closeNode.emit();
  }

  // Disabled for now (no file API yet)
  triggerFileInput() {
    console.warn('File upload not implemented yet');
  }

  onFileSelected(_: Event) {
    // intentionally empty
  }

  // =========================
  // Pagination
  // =========================
  get totalPages(): number {
    return Math.ceil((this.items?.length ?? 0) / this.pageSize);
  }

  get visibleItems(): string[] {
    if (!this.items || !this.items.length) return [];
    const start = this.currentPage * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  ngOnChanges() {
    this.currentPage = 0;
  }

  // =========================
  // Image handling (future)
  // =========================
  getImagePath(file: string): string {
    if (!this.basePath) return '';
    return `${this.basePath}/${file}`;
  }

  openImage(file: string): void {
    this.imageOpen.emit(file);
  }
}
