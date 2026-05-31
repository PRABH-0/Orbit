import { Component, EventEmitter, Input, Output, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../services/file.service';
import { environment } from '../../environments/environment';
import { GoogleDriveService } from '../services/google-drive.service';
import { HttpEvent, HttpEventType } from '@angular/common/http';

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
  @Input() isGoogleFolder: boolean = false;
  @Output() closeNode = new EventEmitter<void>();
  @Output() imageOpen = new EventEmitter<any>();
  @Input() nodeId!: string | null; // 🔥 important
  @Output() fileUploaded = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  pageSize = 70;
  currentPage = 0;

  width = 860;
  height = 600;
  readonly ASPECT_RATIO = 860 / 600;
  minWidth = 716; // Ensures ~500px height to fit 5 rows
  minHeight = 500;
  isResizing = false;

  /** fileId → objectURL */
  imageCache = new Map<string, string>();

  isDraggingOver = false;
  isUploading = false;
  uploadProgress = 0;

  constructor(private fileService: FileService, private googleDriveService: GoogleDriveService) { }
  videoThumbnailCache = new Map<string, string>();

  ngOnChanges() {
    this.currentPage = 0;
    console.log("ITEMS RECEIVED:", this.items);
    this.preloadVisibleImages();
  }

  // =========================
  // DRAG & DROP
  // =========================
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isGoogleFolder) return;
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;

    if (this.isGoogleFolder) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles(Array.from(files));
    }
  }

  async uploadFiles(files: File[]) {
    if (!this.nodeId) return;
    
    this.isUploading = true;
    this.uploadProgress = 0;

    let totalUploaded = 0;
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      try {
        await new Promise<void>((resolve, reject) => {
          this.fileService.uploadFile(this.nodeId!, file).subscribe({
            next: (event: HttpEvent<any>) => {
              if (event.type === HttpEventType.UploadProgress) {
                const fileProgress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
                // Calculate overall progress
                this.uploadProgress = Math.round(((i / totalFiles) * 100) + (fileProgress / totalFiles));
              } else if (event.type === HttpEventType.Response) {
                resolve();
              }
            },
            error: (err) => {
              console.error(`Failed to upload ${file.name}`, err);
              reject(err);
            }
          });
        });
      } catch (err) {
        // Continue with next file even if one fails
      }
    }

    this.isUploading = false;
    this.uploadProgress = 0;
    this.fileUploaded.emit();
  }

  onResizeStart(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = this.width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isResizing) return;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Use the larger delta to drive the uniform resize
      // This makes the resizing feel responsive to whichever direction the user drags most
      const delta = Math.max(deltaX, deltaY * this.ASPECT_RATIO);

      let newWidth = startWidth + delta;
      let newHeight = newWidth / this.ASPECT_RATIO;

      // Enforce minimums while maintaining exact ratio
      if (newWidth < this.minWidth) {
        newWidth = this.minWidth;
        newHeight = newWidth / this.ASPECT_RATIO;
      }

      this.width = newWidth;
      this.height = newHeight;
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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
    return (file.mimeType || file.contentType || '').toLowerCase();
  }
  isGoogleFile(file: any): boolean {
    return file.isGoogle === true;
  }

  isAudio(file: any): boolean {
    const type = file.contentType || file.mimeType;
    return type?.startsWith('audio/');
  }

  isImage(file: any): boolean {
    const type = file.contentType || file.mimeType;
    return type?.startsWith('image/');
  }

  getLocalImageUrl(file: any): string | null {
    return this.getImageUrl(file.id);
  }

  getFileType(file: any): string {

    const mime = this.getMime(file);

    if (mime === 'application/vnd.google-apps.folder')
      return 'folder';

    if (mime.startsWith('image/'))
      return 'image';

    if (mime.startsWith('video/')) {
      return this.videoThumbnailCache.has(file.id)
        ? 'video'
        : 'video-fallback';
    }

    if (mime.startsWith('audio/'))
      return 'audio';

    if (mime === 'application/pdf' ||
      mime.startsWith('application/vnd.google-apps'))
      return 'pdf';

    return 'default';
  }

  downloadGoogleFile(file: any) {
    const url =
      `${environment.apiBaseUrl}/google-drive/file/${file.id}`;

    this.googleDriveService
      .downloadGoogleFile(url)
      .subscribe({
        next: (res: any) => {

          if (!res || !res.body) return;

          const blob = res.body;
          const objectUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = file.fileName;
          a.click();

          URL.revokeObjectURL(objectUrl);
        },
        error: (err: any) => {
          console.error('Google download failed', err);
        }
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
    if (file.isPhoto) {
      this.imageOpen.emit({
        type: 'image',
        id: file.id,
        url: file.fullUrl,
        fileName: file.fileName
      });
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

    const url =
      `${environment.apiBaseUrl}/google-drive/file/${file.id}`;

    this.googleDriveService
      .downloadGoogleFile(url)
      .subscribe({
        next: (res: any) => {

          if (!res || !res.body) return;

          const blob = res.body;
          const objectUrl = URL.createObjectURL(blob);

          const type = this.detectType(file);

          this.imageOpen.emit({
            type: type,
            id: file.id,
            url: objectUrl,
            fileName: file.fileName
          });
        },
        error: (err: any) => {
          console.error('Google preview failed', err);
        }
      });
  }

  openText(file: any) {
    this.fileService.downloadFile(file.id).subscribe({
      next: (res: any) => {
        const blob = res.body!;
        blob.text().then((text: string) => {
          this.imageOpen.emit({
            type: 'text',
            id: file.id,
            fileName: file.fileName,
            content: text
          });
        });
      },
      error: (err: any) => {
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



  isVideo(file: any): boolean {
    return this.getMime(file).startsWith('video/');
  }



  isPdf(file: any): boolean {
    return this.getMime(file) === 'application/pdf';
  }


  getFileIcon(file: any): string {

    if (this.isFolder(file)) return '📁';
    if (this.isVideo(file)) return '🎬';
    if (this.isPdf(file)) return '📄';
    if (this.isAudio(file)) return '🎵';
    if (this.isGoogleDoc(file)) return '📘';

    return '📦';
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
      next: (res: any) => {
        const cache = res.headers.get('x-cache');
        console.log(`FILE ${fileId} CACHE →`, cache); // HIT / MISS

        const blob = res.body!;
        const url = URL.createObjectURL(blob);
        this.imageCache.set(fileId, url);
      },
      error: (err: any) => {
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
    this.fileService.downloadFile(file.id).subscribe((res: any) => {
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
      error: (err: any) => {
        console.error('Delete failed', err);
      }
    });
  }

  onFileSelected(event: Event) {
    if (this.isGoogleFolder) {
      console.warn("Upload not allowed for cloud folder");
      return;
    }
    if (!this.nodeId) {
      console.warn('Upload blocked: nodeId is null');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    this.fileService.uploadFile(this.nodeId, file).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.Response) {
          console.log('File uploaded successfully');

          // reset input (important)
          input.value = '';

          // tell parent to refresh files
          this.fileUploaded.emit();
        }
      },
      error: (err: any) => {
        console.error('Upload failed', err);
      }
    });
  }

  close() {
    this.closeNode.emit();
  }
}
