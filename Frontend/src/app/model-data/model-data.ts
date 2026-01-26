import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-model-data',
  standalone: true,
  imports: [NgFor,NgIf],
  templateUrl: './model-data.html',
  styleUrl: './model-data.css',
})
export class ModelData {

  @Input() x!: number;
  @Input() y!: number;

  // 🔥 NEW
  @Input() title = '';
  @Input() items: string[] = [];
  @Input() basePath = '';

  @Output() imageOpen = new EventEmitter<string>();
pageSize = 70;
currentPage = 0;
get totalPages(): number {
  return Math.ceil(this.items.length / this.pageSize);
}

get visibleItems(): string[] {
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

  getImagePath(file: string): string {
    return `${this.basePath}/${file}`;
  }

  openImage(file: string): void {
    this.imageOpen.emit(file);
  }
}
