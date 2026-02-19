import { Component, EventEmitter, Input, Output, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgFor, NgIf ,NgSwitch} from '@angular/common';
import { FileService } from '../services/file.service';
import { environment } from '../../environments/environment';
import { GoogleDriveService } from '../services/google-drive.service';

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

  constructor(private fileService: FileService , private googleDriveService :GoogleDriveService) {}

  ngOnChanges() {
    this.currentPage = 0;
    this.preloadVisibleImages();
  }

  get visibleItems(): any[] {
    const start = this.currentPage * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  openInNewTab(file: any) {

  const url = `${environment.apiBaseUrl}/File/${file.id}/view`;

  window.open(url, '_blank');
}
getMime(file: any): string {
  return (file.contentType || file.mimeType || '').toLowerCase();
}

downloadGoogleFile(file: any) {

  const providerToken =
    localStorage.getItem('google_provider_token');

  const url =
    `${environment.apiBaseUrl}/google-drive/file/${file.id}`;

  this.googleDriveService
    .downloadGoogleFile(url, providerToken!)
    .subscribe(res => {

      const blob = res.body!;
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = file.fileName;
      a.click();

      URL.revokeObjectURL(objectUrl);
    });
}

handleGoogleFile(file: any) {

  const type = this.detectType(file);

  if (type === 'other') {

    const confirmDownload = confirm(
      `This file type cannot be previewed.\n\nDo you want to download "${file.fileName}"?`
    );

    if (confirmDownload) {
      this.downloadGoogleFile(file);
    }

    return;
  }

  // only previewable files download blob
  this.openGoogleFile(file);
}

openFile(file: any) {

  if (file.isGoogle) {
    this.handleGoogleFile(file);
    return;
  }

  const type = this.detectType(file);

  if (type === 'other') {

    const confirmDownload = confirm(
      `This file type cannot be previewed.\n\nDo you want to download "${file.fileName}"?`
    );

    if (confirmDownload) {
      this.download(file);
    }

    return;
  }

  switch (type) {
    case 'image':
      this.openImage(file);
      break;

    case 'pdf':
      this.openPdf(file);
      break;

    case 'video':
      this.openVideo(file);
      break;

    case 'audio':
      this.openAudio(file);
      break;

    case 'text':
      this.openText(file);
      break;
  }
}


isText(file: any): boolean {
  return (
    file.contentType?.startsWith('text/') ||
    /\.(txt|js|ts|tsx|json|html|css|md)$/i.test(file.fileName)
  );
}

detectType(file: any): 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other' {

  const mime = file.contentType?.toLowerCase() || '';
  const name = file.fileName?.toLowerCase() || '';

  // 🔥 GOOGLE DOCS → treat as PDF
  if (mime.startsWith('application/vnd.google-apps')) {
    return 'pdf';
  }

  if (mime.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) {
    return 'image';
  }

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (mime.startsWith('video/') ||
      /\.(mp4|webm|ogg|mov)$/i.test(name)) {
    return 'video';
  }

  if (mime.startsWith('audio/') ||
      /\.(mp3|wav|aac|flac)$/i.test(name)) {
    return 'audio';
  }

  if (
    mime.startsWith('text/') ||
    /\.(txt|js|ts|json|html|css|md)$/i.test(name)
  ) {
    return 'text';
  }

  return 'other';
}


openGoogleFile(file: any) {

  const providerToken =
    localStorage.getItem('google_provider_token');

  const url =
    `${environment.apiBaseUrl}/google-drive/file/${file.id}`;

  this.googleDriveService.downloadGoogleFile(url, providerToken!)
    .subscribe(res => {

      const blob = res.body!;
      const objectUrl = URL.createObjectURL(blob);

      this.imageOpen.emit({
       type: this.detectType(file),

        id: file.id,
        url: objectUrl,
        fileName: file.fileName
      });
    });
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
    url: this.getStreamUrl(file.id),  // ✅ FIXED
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
isFolder(file: any): boolean {
  return this.getMime(file) === 'application/vnd.google-apps.folder';
}
isPreviewable(file: any): boolean {
  const type = this.detectType(file);
  return type !== 'other';
}

isGoogleDoc(file: any): boolean {
  return this.getMime(file).startsWith('application/vnd.google-apps');
}

isImage(file: any): boolean {
  return this.getMime(file).startsWith('image/');
}

isVideo(file: any): boolean {
  return this.getMime(file).startsWith('video/');
}

isAudio(file: any): boolean {
  return this.getMime(file).startsWith('audio/');
}

isPdf(file: any): boolean {
  return this.getMime(file) === 'application/pdf';
}


getFileIcon(file: any): string {
  if (this.isVideo(file)) return '🎬';
  if (this.isPdf(file)) return '📄';
  if (this.isAudio(file)) return '🎵';
  return '📁';
}

 preloadVisibleImages() {
  for (const file of this.visibleItems) {
if (file.isGoogle) continue; // IMPORTANT


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
