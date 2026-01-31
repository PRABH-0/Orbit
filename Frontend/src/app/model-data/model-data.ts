import { Component, EventEmitter, Input, Output, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FileService } from '../services/file.service';

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
  @Input() title: string | null = '';
  @Input() items: any[] = [];

  @Output() closeNode = new EventEmitter<void>();
  @Output() imageOpen = new EventEmitter<string>();
@Input() nodeId!: string | null; // 🔥 important
@Output() fileUploaded = new EventEmitter<void>();

@ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  pageSize = 70;
  currentPage = 0;

  /** fileId → objectURL */
  imageCache = new Map<string, string>();

  constructor(private fileService: FileService) {}

  ngOnChanges() {
    this.currentPage = 0;
    this.preloadVisibleImages();
  }

  get visibleItems(): any[] {
    const start = this.currentPage * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  preloadVisibleImages() {
    for (const file of this.visibleItems) {
      if (!this.imageCache.has(file.id)) {
        this.loadImage(file.id);
      }
    }
  }

  loadImage(fileId: string) {
    this.fileService.downloadFile(fileId).subscribe({
      next: res => {
        const cache = res.headers.get('x-cache');
        console.log(`FILE ${fileId} CACHE →`, cache); // HIT / MISS

        const blob = res.body!;
        const url = URL.createObjectURL(blob);
        this.imageCache.set(fileId, url);
      },
      error: err => {
        console.error('Image load failed', err);
      }
    });
  }

  getImageUrl(fileId: string): string | null {
    return this.imageCache.get(fileId) ?? null;
  }

  openImage(file: any) {
    this.imageOpen.emit(this.getImageUrl(file.id)!);
  }
triggerFileInput(event: MouseEvent) {
  event.stopPropagation();
  this.fileInput.nativeElement.click();
}

onFileSelected(event: Event) {
  if (!this.nodeId) {
    console.warn('Upload blocked: nodeId is null');
    return;
  }

  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  this.fileService.uploadFile(this.nodeId, file).subscribe({
    next: () => {
      console.log('File uploaded successfully');

      // reset input (important)
      input.value = '';

      // tell parent to refresh files
      this.fileUploaded.emit();
    },
    error: err => {
      console.error('Upload failed', err);
    }
  });
}

  close() {
    this.closeNode.emit();
  }
}
