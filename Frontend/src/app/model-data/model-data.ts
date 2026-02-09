import { Component, EventEmitter, Input, Output, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgFor, NgIf ,NgSwitch} from '@angular/common';
import { FileService } from '../services/file.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-model-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-data.html',
  styleUrl: './model-data.css',
})
export class ModelData implements OnChanges {

  @Input() x!: number;
  @Input() y!: number;
  @Input() title: string | null = '';
  @Input() items: any[] = [];

  @Output() closeNode = new EventEmitter<void>();
  @Output() imageOpen = new EventEmitter<any>();
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
  openFile(file: any) {
  const type = file.contentType;

  if (type.startsWith('image/')) {
    this.openImage(file);
  } else if (type === 'application/pdf') {
    this.openPdf(file);
  } else if (type.startsWith('video/')) {
    this.openVideo(file);
  } else if (type.startsWith('audio/')) {
    this.openAudio(file);
  }
  else if (this.isText(file)) {
    this.openText(file); // 🔥 NEW
  }
  else {
    this.download(file);
  }
}
isText(file: any): boolean {
  return (
    file.contentType?.startsWith('text/') ||
    /\.(txt|js|ts|tsx|json|html|css|md)$/i.test(file.fileName)
  );
}

openText(file: any) {
  this.fileService.downloadFile(file.id).subscribe({
    next: res => {
      const blob = res.body!;
      blob.text().then(text => {
        this.imageOpen.emit({
          type: 'text',
          id: file.id,
          fileName: file.fileName,
          content: text
        });
      });
    },
    error: err => {
      console.error('Text preview failed', err);
    }
  });
}

openPdf(file: any) {
  this.imageOpen.emit({
    type: 'pdf',
    id: file.id,
    url: `${environment.apiBaseUrl}/${file.id}/view`,
    fileName: file.fileName
  });
}

getStreamUrl(fileId: string): string {
  return `${environment.apiBaseUrl}/File/${fileId}/view`;
}
openVideo(file: any) {
  this.imageOpen.emit({
    type: 'video',
    id: file.id,
    url: this.getStreamUrl(file.id),
    fileName: file.fileName
  });
}

openAudio(file: any) {
  this.imageOpen.emit({
    type: 'audio',
    id: file.id,
    url: this.getStreamUrl(file.id),
    fileName: file.fileName
  });
}

isImage(file: any): boolean {
  return file.contentType?.startsWith('image/');
}

isVideo(file: any): boolean {
  return file.contentType?.startsWith('video/');
}

isPdf(file: any): boolean {
  return file.contentType === 'application/pdf';
}

isAudio(file: any): boolean {
  return file.contentType?.startsWith('audio/');
}

getFileIcon(file: any): string {
  if (this.isVideo(file)) return '🎬';
  if (this.isPdf(file)) return '📄';
  if (this.isAudio(file)) return '🎵';
  return '📁';
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
  this.imageOpen.emit({
    type: 'image',
    id: file.id,
    url: this.getImageUrl(file.id),
    fileName: file.fileName
  });
}




triggerFileInput(event: MouseEvent) {
  event.stopPropagation();
  this.fileInput.nativeElement.click();
}

download(file: any) {
  this.fileService.downloadFile(file.id).subscribe(res => {
    const blob = res.body!;
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    a.click();

    URL.revokeObjectURL(url);
  });
}
delete(file: any) {
  if (!confirm('Delete this file?')) return;

  this.fileService.deleteFile(file.id).subscribe({
    next: () => {
      this.imageCache.delete(file.id);
      this.fileUploaded.emit(); // refresh list
    },
    error: err => {
      console.error('Delete failed', err);
    }
  });
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
