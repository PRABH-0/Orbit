import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-model-data',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './model-data.html',
  styleUrl: './model-data.css',
})
export class ModelData {
  @Input() x!: number;
  @Input() y!: number;
  @Input() title = '';
  @Input() items: string[] = [];
  @Input() basePath = '';
  @Output() closeNode = new EventEmitter<void>();
  @Output() addImage = new EventEmitter<File>();
  @Output() imageOpen = new EventEmitter<string>();
  pageSize = 70;
  currentPage = 0;

  close() {
    this.closeNode.emit();
  }

  triggerFileInput() {
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"]'
    );
    input?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    const file = input.files[0];
    this.addImage.emit(file);
    input.value = '';
  }

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