import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';

import { Header } from '../header/header';
import { Directory } from '../directory/directory';
import { Edge } from '../edge/edge';
import { ModelData } from '../model-data/model-data';
import { DirectoryService } from '../services/directory.service';
import { FileService } from '../services/file.service';
import { UserMenu } from '../user-menu/user-menu';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { supabase } from '../supabase.client';
import { UserStateService } from '../services/user-state.service';
import { AuthService } from '../services/auth.service';
import { GoogleDriveService } from '../services/google-drive.service';
import { GooglePhotosService } from '../services/google-photos.service';

import { HttpEvent, HttpEventType } from '@angular/common/http';
import { LoaderService } from '../services/loader.service';
import { ToastService } from '../services/toast.service';
import { DialogService } from '../services/dialog.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [Header, Directory, UserMenu, Edge, ModelData, FormsModule, NgFor, NgIf, CommonModule],
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
})
export class Canvas implements OnInit, AfterViewInit {
  @ViewChild('gridBackground', { static: true }) gridBackground!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasContent', { static: true }) canvasContent!: ElementRef<HTMLDivElement>;
  @ViewChild('edgesGroup', { static: true }) edgesGroup!: ElementRef<SVGGElement>;
  @ViewChild('headerFileInput') headerFileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('centerCircle', { static: true }) centerCircle!: ElementRef<HTMLDivElement>;
  @Output() imageOpen = new EventEmitter<string>();

  directories: any[] = [];
  username: string | null = null;

  selectedParentFolderId: string | null = null;
  selectedFolderId: string | null = null;
  currentFolderName: string | null = null;
  selectedFolderItems: any[] = [];
  lastMovedFolder: any = null;
  activeFolder: any = null;
isEditMode = false;
editingFolder: any = null;
  dataNodePosition: { x: number; y: number } | null = null;
  selectedFile: {
    type: 'image' | 'pdf' | 'video' | 'audio' | 'text';
    id: string;
    url?: string;
    safeUrl?: SafeUrl;
    content?: string;
    fileName?: string;
    size?: number;
    lastModified?: string;
    storageProvider?: string;
  } | null = null;

  // Unified File Viewer State
  zoomLevel = 1.0;
  panX = 0;
  panY = 0;
  isViewerPanning = false;
  viewerPanStartX = 0;
  viewerPanStartY = 0;
  showSidebar = true;
  isLoading = false;
  textLines: string[] = [];

  avatarUrl: string | null = null;
isDeleteModalOpen = false;
deleteTargetFolder: any = null;
  isAddFolderOpen = false;
  draftFolder: any = null;
  showUserMenu = false;
  rootOpen = false;
  selectedFileId: string | null = null;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private x = 0;
  private y = 0;
  showModelData = false;
  cacheBuster = Date.now();
  isRootOffScreen = false;
  isPanningToHome = false;
  canvasScale = 1.0;
  private animationFrameId: number | null = null;

  constructor(
    private googlePhotosService: GooglePhotosService,
    private directoryService: DirectoryService,
    private fileService: FileService,
    private sanitizer: DomSanitizer,
    public userState:UserStateService,
    public auth : AuthService,
    private googleDriveService: GoogleDriveService,
    private router: Router,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private dialogService: DialogService
  ) {
    // Initial centering of the 2500, 2500 point
    this.x = (window.innerWidth / 2) - 2500;
    this.y = (window.innerHeight / 2) - 2500;
  }

  async ngOnInit() {
    const user: any = await this.auth.syncUser();

    if (!user) {
      this.router.navigate(['/signin']);
      return;
    }
    this.avatarUrl = user.profilePictureUrl;

    this.userState.setUser(user);
    this.loadDirectories();
    const { data } = await supabase.auth.getSession();
    localStorage.setItem(
      'google_provider_token',
      data.session?.provider_token!
    );
  }

  ngAfterViewInit() {
    this.update();
  }
@HostListener('touchstart', ['$event'])
onTouchStart(e: TouchEvent) {
  this.cancelPanningAnimation();
  this.isDragging = true;
  const touch = e.touches[0];

  this.startX = touch.clientX - this.x;
  this.startY = touch.clientY - this.y;
}

@HostListener('touchmove', ['$event'])
onTouchMove(e: TouchEvent) {
  if (!this.isDragging) return;

  const touch = e.touches[0];

  this.x = touch.clientX - this.startX;
  this.y = touch.clientY - this.startY;

  this.update();
}

@HostListener('touchend')
onTouchEnd() {
  this.isDragging = false;
}
loadDirectories() {
  this.directoryService.getDirectories().subscribe({
    next: (data) => {

      this.directories = data.map((d) => ({
        ...d,
        isOpen: false,
      }));

      // 🔥 Check if GoogleDrive folder already exists in DB
      // const hasGoogle = this.directories.some(
      //   d => d.storageProvider === 'GoogleDrive'
      // );

      // 🔥 Only add virtual if not saved in DB
      // if (!hasGoogle) {
      //   this.directories.push({
      //     id: 'google-drive',
      //     name: 'Google Drive',
      //     x: 2700,
      //     y: 2500,
      //     parentId: null,
      //     isOpen: false,
      //     isVirtual: true,
      //     storageProvider: 'GoogleDrive'
      //   });
      // }
      // 🔥 Google Photos virtual folder
// const hasPhotos = this.directories.some(
//   d => d.storageProvider === 'GooglePhotos'
// );

// if (!hasPhotos) {
//   this.directories.push({
//     id: 'google-photos',
//     name: 'Google Photos',
//     x: 2900,
//     y: 2500,
//     parentId: null,
//     isOpen: false,
//     isVirtual: true,
//     storageProvider: 'GooglePhotos'
//   });
// }
    }
  });
}

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu() {
    this.showUserMenu = false;
  }

openEditFolderModal() {
  if (!this.activeFolder) {
    return;
  }

  this.isEditMode = true;
  this.editingFolder = this.activeFolder;

  this.draftFolder = {
    name: this.activeFolder.name,
    x: this.activeFolder.x,
    y: this.activeFolder.y,
    parentId: this.activeFolder.parentId
  };

  this.isAddFolderOpen = true;
}
  payment() {
    this.router.navigate(['/payment']);
  }
  profilePage() {
    this.router.navigate(['/profile']);
  }
  aboutpage() {
    this.router.navigate(['about']);
  }
  feedbackPage() {
    this.router.navigate(['about'], { queryParams: { feedback: 'true' } });
  }

  onFolderSettings() {
    if (this.currentFolderName === 'Root' || !this.selectedFolderId) {
      return;
    }

    if (!this.activeFolder) {
      this.activeFolder = this.directories.find(d => d.id === this.selectedFolderId);
    }

    if (!this.activeFolder) {
      return;
    }

    this.openEditFolderModal();
  }

  closeFolderSidebar() {

  }

  getParentName(): string {
    if (!this.activeFolder?.parentId) return 'Root';
    const parent = this.directories.find(d => d.id === this.activeFolder.parentId);
    return parent ? parent.name : 'Unknown';
  }

  async onDeleteFolder() {
    if (!this.selectedFolderId || !this.activeFolder) return;

 // Close sidebar first

    const confirmed = await this.dialogService.confirm(
      'Delete Folder',
      `Are you sure you want to delete "${this.activeFolder.name}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      this.deleteTargetFolder = this.activeFolder;
      this.confirmDeleteFolder();
    }
  }
confirmDeleteFolder() {
  if (!this.deleteTargetFolder) return;

  const folderId = this.deleteTargetFolder.id;

  this.directoryService.deleteDirectory(folderId).subscribe({
    next: () => {
      this.directories = this.directories.filter(
        d => d.id !== folderId && d.parentId !== folderId
      );

      this.closeModelData();
      this.selectedFolderId = null;
      this.selectedParentFolderId = null;
      this.currentFolderName = null;
      this.activeFolder = null;

      this.closeDeleteModal();
      this.resetModal();
      this.toastService.success('Folder Deleted Successfully');
    },
    error: (err) => {
      console.error('Delete failed', err);
      this.toastService.error('Delete failed');
      this.closeDeleteModal();
    }
  });
}

closeDeleteModal() {
  this.isDeleteModalOpen = false;
  this.deleteTargetFolder = null;
}
  onAddFolder() {
    const parentId = this.selectedParentFolderId;

    const parent = !parentId
      ? { id: null, x: 2500, y: 2500 }
      : this.directories.find((d) => d.id === parentId);

    if (!parent) return;

    if (parentId) {
      parent.isOpen = true; // only ensure parent open
    }
    this.rootOpen = true;

    this.draftFolder = {
      name: 'New Folder',
      parentId: parent.id,
      x: parent.x + 120,
      y: parent.y + 120,
      isOpen: false,
      isDraft: true,
    };

    this.directories.push(this.draftFolder);
    this.isAddFolderOpen = true;
  }

saveAddFolder() {
  if (!this.draftFolder) return;

// 🔥 EDIT MODE
if (this.isEditMode && this.editingFolder) {

  const id = this.editingFolder.id;

  const nameChanged = this.draftFolder.name !== this.editingFolder.name;
  const positionChanged =
    this.draftFolder.x !== this.editingFolder.x ||
    this.draftFolder.y !== this.editingFolder.y;

  // API calls
  if (nameChanged) {
    this.directoryService
      .renameDirectory(id, this.draftFolder.name)
      .subscribe(() => {
        this.toastService.success('Folder Renamed Successfully');
      });
  }

  if (positionChanged) {
    if (!id || id === 'undefined') {
      console.warn('Cannot update position: folder ID is missing');
    } else {
      this.directoryService
        .updatePosition(id, this.draftFolder.x, this.draftFolder.y)
        .subscribe();
    }
  }

  // 🔥 update folder inside directories array
  const folderIndex = this.directories.findIndex(d => d.id === id);

  if (folderIndex !== -1) {
    this.directories[folderIndex] = {
      ...this.directories[folderIndex],
      name: this.draftFolder.name,
      x: this.draftFolder.x,
      y: this.draftFolder.y
    };
  }

  // 🔥 update active folder
  if (this.activeFolder) {
    this.activeFolder = {
      ...this.activeFolder,
      name: this.draftFolder.name
    };
  }

  // 🔥 update header
  this.currentFolderName = this.draftFolder.name;

  this.resetModal();
  return;
}

  // 🔥 CREATE MODE (existing logic)
  const payload = {
    name: this.draftFolder.name,
    x: this.draftFolder.x,
    y: this.draftFolder.y,
    parentId: this.draftFolder.parentId,
    basePath: null,
  };

  this.directoryService.createDirectory(payload).subscribe({
    next: (created) => {
      Object.assign(this.draftFolder, created);
      delete this.draftFolder.isDraft;
      this.resetModal();
      this.toastService.success('Folder Created Successfully');
    },
    error: (err) => {
      console.error('Create failed', err);
      this.toastService.error('Create failed');
    }
  });
}
private resetModal() {
  this.draftFolder = null;
  this.isAddFolderOpen = false;
  this.isEditMode = false;
  this.editingFolder = null;
}
  onAddItem() {
    // Upload to root if no folder selected
    if (!this.selectedFolderId) {
      this.selectedFolderId = 'ROOT'; // or null if backend supports root
    }

    this.headerFileInput.nativeElement.click();
  }
async logout() {
  localStorage.clear();
  await this.auth.logout(this.router);
}

  onHeaderFileSelected(event: Event) {
    if (
  this.activeFolder?.storageProvider === 'GoogleDrive' ||
  this.activeFolder?.storageProvider === 'GooglePhotos'
) {
  console.warn("Upload disabled for cloud folders");
  return;
}
    if (!this.selectedFolderId) return;

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    this.loaderService.show();
    this.fileService.uploadFile(this.selectedFolderId, file).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.Response) {
          console.log('File uploaded from header');
          this.loaderService.hide();

          input.value = '';

          // reload files
          this.reloadFiles();

          // auto-open model-data if first file
          if (!this.showModelData) {
            const dir = this.directories.find((d) => d.id === this.selectedFolderId);
            if (dir) {
              this.setDataNodePosition(dir);
              this.showModelData = true;
            }
          }
        }
      },
      error: (err) => {
        console.error('Header upload failed', err);
        this.loaderService.hide();
      },
    });
  }

  cancelAddFolder() {
    if (!this.draftFolder) return;
    this.directories = this.directories.filter((d) => d !== this.draftFolder);
    this.draftFolder = null;
    this.isAddFolderOpen = false;
  }

  // =========================
  // MOVE FOLDER
  // =========================
  onFolderMoved(dir: any, pos: { x: number; y: number }) {
    dir.x = pos.x;
    dir.y = pos.y;
    this.lastMovedFolder = dir;

    if (this.selectedFolderId === dir.id && this.dataNodePosition) {
      this.setDataNodePosition(dir);
    }
  }
  downloadFile() {
    if (!this.selectedFile) return;

    this.fileService.downloadFile(this.selectedFile.id).subscribe({
      next: (res) => {
        const blob = res.body!;
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = this.getDownloadName(res) ?? 'file';
        a.click();

        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed', err);
      },
    });
  }
  getDownloadName(res: any): string | null {
    const disposition = res.headers.get('content-disposition');
    if (!disposition) return null;

    const match = /filename="?(.+)"?/.exec(disposition);
    return match ? match[1] : null;
  }

  async deleteFile() {
    if (!this.selectedFile) return;

    const confirmed = await this.dialogService.confirm('Delete File', 'Are you sure you want to delete this file?');
    if (!confirmed) return;

    this.fileService.deleteFile(this.selectedFile.id).subscribe({
      next: () => {
        this.closeFileViewer();
        this.reloadFiles();
        this.toastService.success('File Deleted Successfully');
      },
      error: (err: any) => {
        console.error('Delete failed', err);
        this.toastService.error('Delete failed');
      },
    });
  }

  getModelDataAnchor() {
    if (!this.dataNodePosition) return null;

    const WIDTH = 800; // same as model-data width
    const HEIGHT = 580; // same as model-data height

    return {
      x: this.dataNodePosition.x,
      y: this.dataNodePosition.y + HEIGHT / 2,
    };
  }
  private mapMimeType(mime: string): 'image' | 'pdf' | 'video' | 'audio' | 'text' {

  if (!mime) return 'text';

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';

  return 'text';
}

  onFolderClick(dir: any) {
   if (dir.storageProvider === 'GoogleDrive'){

  console.log("Google Drive folder clicked");

  // 🔥 Set position manually
  this.setDataNodePosition(dir);

  this.selectedFolderId = dir.id;
  this.currentFolderName = "Google Drive";
  this.activeFolder = dir;

// this.googleDriveService.getGoogleDriveFiles()
//   .subscribe({
//     next: (files: any[] | undefined) => {

//       if (!files) {
//         this.selectedFolderItems = [];
//         return;
//       }

//       this.selectedFolderItems = files.map(f => ({
//         id: f.id,
//         fileName: f.name,
//         contentType: f.mimeType,
//         isGoogle: true,
//         thumbnail: f.thumbnail
//       }));

//       this.showModelData = true;
//     },  // ✅ ← THIS COMMA WAS MISSING

//     error: (err) => {
//       console.error("Google API error:", err);
//     }
//   });
// if (dir.storageProvider === 'GooglePhotos') {

//   console.log("Google Photos folder clicked");

//   this.setDataNodePosition(dir);

//   this.selectedFolderId = dir.id;
//   this.currentFolderName = "Google Photos";
//   this.activeFolder = dir;

//   this.googlePhotosService.getGooglePhotos()
//     .subscribe({
//       next: photos => {

//         this.selectedFolderItems = photos.map(p => ({
//           id: p.id,
//           fileName: p.name,
//           contentType: p.mimeType,
//           isGoogle: true,
//           thumbnail: p.thumbnail,
//           fullUrl: p.fullUrl,
//           isPhoto: true
//         }));

//         this.showModelData = true;
//       },
//       error: err => {
//         console.error("Google Photos API error:", err);
//       }
//     });

//   return;
// }
  return;
}


  if (!dir || !dir.id || dir.id === 'undefined') return;

  dir.isOpen = !dir.isOpen;

  if (!dir.isOpen) {
    this.closeAllChildren(dir.id);

    this.selectedFolderId = dir.id;
    this.selectedParentFolderId = dir.id;
    this.currentFolderName = dir.name;
    this.activeFolder = dir;

    this.closeModelData();

    return;
  }

  this.showModelData = false;
  this.dataNodePosition = null;
  this.selectedFolderItems = [];
  this.selectedFile = null;

  this.selectedFolderId = dir.id;
  this.selectedParentFolderId = dir.id;
  this.currentFolderName = dir.name;
  this.activeFolder = dir;
  this.rootOpen = true;

  this.fileService.getFilesByNode(dir.id).subscribe({
    next: (files) => {
      this.selectedFolderItems = files ?? [];

      if (files && files.length > 0) {
        this.setDataNodePosition(dir);
        this.showModelData = true;
      }
    },
    error: () => {
      this.selectedFolderItems = [];
      this.showModelData = false;
      this.dataNodePosition = null;
    },
  });
}

  hasChildren(dir: any): boolean {
    return this.directories.some((d) => d.parentId === dir.id);
  }

  toggleFolder(id: string) {
    const folder = this.directories.find((d) => d.id === id);
    if (!folder) return;
    folder.isOpen = !folder.isOpen;
    if (!folder.isOpen) this.closeAllChildren(folder.id);
  }

  closeAllChildren(parentId: string) {
    for (const child of this.directories.filter((d) => d.parentId === parentId)) {
      child.isOpen = false;
      this.closeAllChildren(child.id);
    }
  }

  shouldShow(dir: any): boolean {
    if (!dir.parentId) return this.rootOpen;
    const parent = this.directories.find((d) => d.id === dir.parentId);
    return !!parent?.isOpen;
  }

 toggleRoot() {
  this.rootOpen = !this.rootOpen;

  this.selectedParentFolderId = null;
  this.selectedFolderId = null;
  this.activeFolder = null;
  this.currentFolderName = 'Root';
  if (!this.rootOpen) {
    this.directories.forEach((d) => (d.isOpen = false));
    this.closeModelData();
    return;
  }


  this.showModelData = false;
  this.dataNodePosition = null;
  this.selectedFolderItems = [];
}

  setDataNodePosition(dir: any) {
    const GAP = 160;
    const WIDTH = 800;
    const HEIGHT = 580;

    const CENTER_X = 2500;
    const CENTER_Y = 2500;

    let x = dir.x;
    let y = dir.y;

    if (dir.x < CENTER_X) {
      x = dir.x - WIDTH - GAP;
    } else {
      x = dir.x + GAP;
    }

    if (dir.y < CENTER_Y) {
      y = dir.y - HEIGHT - GAP / 2;
    } else {
      y = dir.y - HEIGHT / 2;
    }

    this.dataNodePosition = { x, y };
  }

  getVisibleEdges() {
    const edges: any[] = [];
    const ROOT_X = 2500;
    const ROOT_Y = 2500;

    // Folder → Folder edges (existing)
    for (const dir of this.directories) {
      if (!dir.parentId && this.rootOpen) {
        edges.push({ x1: ROOT_X, y1: ROOT_Y, x2: dir.x, y2: dir.y });
        continue;
      }

      const parent = this.directories.find((d) => d.id === dir.parentId);
      if (!parent || !parent.isOpen) continue;

      edges.push({ x1: parent.x, y1: parent.y, x2: dir.x, y2: dir.y });
    }

    // 🔥 NEW: Folder → ModelData edge
    if (this.selectedFolderId && this.dataNodePosition) {
      const folder = this.directories.find((d) => d.id === this.selectedFolderId);
      const modelAnchor = this.getModelDataAnchor();

      if (folder && modelAnchor) {
        edges.push({
          x1: folder.x,
          y1: folder.y,
          x2: modelAnchor.x,
          y2: modelAnchor.y,
          isModelEdge: true,
        });
      }
    }

    return edges;
  }

  openImage(payload: any) {
    this.isLoading = true;
    this.resetZoom();

    if (payload.type === 'text') {
      this.textLines = payload.content ? payload.content.split('\n') : [];
      this.selectedFile = {
        ...payload,
        storageProvider: this.activeFolder?.storageProvider || 'Local'
      };
      this.isLoading = false;
      return;
    }

    if (payload.type === 'pdf') {
      payload.safeUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(payload.url);
    }

    this.selectedFile = {
      ...payload,
      storageProvider: this.activeFolder?.storageProvider || 'Local'
    };
  }

  // =========================
  // FILE PREVIEW ZOOM / PAN / SIDEBAR / LOAD HELPERS
  // =========================
  onMediaLoaded() {
    this.isLoading = false;
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  zoomIn() {
    this.zoomLevel = Math.min(5.0, this.zoomLevel + 0.25);
  }

  zoomOut() {
    this.zoomLevel = Math.max(0.1, this.zoomLevel - 0.25);
    if (this.zoomLevel <= 1.0) {
      this.panX = 0;
      this.panY = 0;
    }
  }

  resetZoom() {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  onViewerImageWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = 0.05;
    const direction = event.deltaY < 0 ? 1 : -1;
    this.zoomLevel = Math.max(0.1, Math.min(5.0, this.zoomLevel + direction * zoomFactor));
    if (this.zoomLevel <= 1.0) {
      this.panX = 0;
      this.panY = 0;
    }
  }

  onViewerImageDblClick() {
    if (this.zoomLevel > 1.0) {
      this.resetZoom();
    } else {
      this.zoomLevel = 2.5;
    }
  }

  onViewerImageMouseDown(event: MouseEvent) {
    if (this.zoomLevel <= 1.0) return;
    this.isViewerPanning = true;
    this.viewerPanStartX = event.clientX - this.panX;
    this.viewerPanStartY = event.clientY - this.panY;
    event.preventDefault();
  }

  onViewerImageMouseMove(event: MouseEvent) {
    if (!this.isViewerPanning) return;
    this.panX = event.clientX - this.viewerPanStartX;
    this.panY = event.clientY - this.viewerPanStartY;
    event.preventDefault();
  }

  onViewerImageMouseUp() {
    this.isViewerPanning = false;
  }

  onViewerImageTouchStart(event: TouchEvent) {
    if (this.zoomLevel <= 1.0 || event.touches.length === 0) return;
    this.isViewerPanning = true;
    const touch = event.touches[0];
    this.viewerPanStartX = touch.clientX - this.panX;
    this.viewerPanStartY = touch.clientY - this.panY;
  }

  onViewerImageTouchMove(event: TouchEvent) {
    if (!this.isViewerPanning || event.touches.length === 0) return;
    const touch = event.touches[0];
    this.panX = touch.clientX - this.viewerPanStartX;
    this.panY = touch.clientY - this.viewerPanStartY;
  }

  onViewerImageTouchEnd() {
    this.isViewerPanning = false;
  }

  formatBytes(bytes: number | undefined): string {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return 'Unknown Size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'Unknown Date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Unknown Date';
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown Date';
    }
  }

  getFriendlyType(fileName: string | undefined): string {
    if (!fileName) return 'Unknown Document';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
        return `${ext.toUpperCase()} Image`;
      case 'pdf':
        return 'PDF Document';
      case 'mp4':
      case 'webm':
      case 'ogg':
      case 'mov':
        return `${ext.toUpperCase()} Video`;
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'flac':
        return `${ext.toUpperCase()} Audio`;
      case 'json':
        return 'JSON Document';
      case 'js':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
        return `${ext.toUpperCase()} Source File`;
      case 'md':
        return 'Markdown Document';
      case 'txt':
        return 'Text Document';
      default:
        return 'Document File';
    }
  }

  closeFileViewer() {
    this.selectedFile = null;

    if (this.activeFolder) {
      this.currentFolderName = this.activeFolder.name;
      this.selectedFolderId = this.activeFolder.id;
    }
  }

  reloadFiles() {
    if (!this.selectedFolderId) return;
 if (
    this.activeFolder?.storageProvider === 'GoogleDrive' ||
    this.activeFolder?.storageProvider === 'GooglePhotos'
  ) {
    return;
  }
    const dir = this.directories.find((d) => d.id === this.selectedFolderId);

    this.fileService.getFilesByNode(this.selectedFolderId).subscribe({
      next: (files) => {
        this.selectedFolderItems = files;

        // 🔥 re-sync position after data change
        if (dir && this.dataNodePosition) {
          this.setDataNodePosition(dir);
        }
      },
      error: (err) => {
        console.error('Failed to reload files', err);
      },
    });
  }

  closeModelData() {
    this.selectedFolderId = null;
    this.dataNodePosition = null;
    this.showModelData = false;
  }

  cancelPanningAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isPanningToHome = false;
  }

  @HostListener('wheel', ['$event'])
  onCanvasWheel(e: WheelEvent) {
    if ((e.target as HTMLElement).closest('.model-data, .add-folder-modal, .file-viewer-overlay, .user-menu')) {
      return;
    }
    e.preventDefault();
    this.cancelPanningAnimation();

    const zoomFactor = 0.08;
    const direction = e.deltaY < 0 ? 1 : -1;
    const oldScale = this.canvasScale;
    
    this.canvasScale = Math.max(0.2, Math.min(3.0, this.canvasScale + direction * zoomFactor * this.canvasScale));
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    this.x = mouseX - (mouseX - this.x) * (this.canvasScale / oldScale);
    this.y = mouseY - (mouseY - this.y) * (this.canvasScale / oldScale);
    
    this.update();
  }

  goHome() {
    this.cancelPanningAnimation();
    this.isPanningToHome = true;

    const startX = this.x;
    const startY = this.y;
    const startScale = this.canvasScale;

    const targetX = (window.innerWidth / 2) - 2500;
    const targetY = (window.innerHeight / 2) - 2500;
    const targetScale = 1.0;

    const duration = 1800; // 1.8 seconds flight
    const startTime = performance.now();

    const animate = (now: number) => {
      if (!this.isPanningToHome) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      const t = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      this.x = startX + (targetX - startX) * t;
      this.y = startY + (targetY - startY) * t;
      this.canvasScale = startScale + (targetScale - startScale) * t;

      this.update();

      if (progress < 1.0) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
        this.isPanningToHome = false;

        this.rootOpen = true;
        this.selectedParentFolderId = null;
        this.selectedFolderId = null;
        this.activeFolder = null;
        this.currentFolderName = 'Root';
        this.showModelData = false;
        this.dataNodePosition = null;
        this.selectedFolderItems = [];
        this.selectedFile = null;

        this.update();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // =========================
  // CANVAS DRAG
  // =========================
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.folder-directory')) return;
    this.cancelPanningAnimation();
    this.isDragging = true;
    this.startX = e.clientX - this.x;
    this.startY = e.clientY - this.y;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    this.x = e.clientX - this.startX;
    this.y = e.clientY - this.startY;
    this.update();
  }

 @HostListener('mouseup')
onMouseUp() {
  this.isDragging = false;

  if (
    !this.lastMovedFolder ||
    this.lastMovedFolder.isDraft ||
    !this.lastMovedFolder.id ||
    this.lastMovedFolder.id === 'undefined'
  ) {
    this.lastMovedFolder = null;
    return;
  }

  const { id, x, y, isVirtual, name } = this.lastMovedFolder;

  // 🔥 Google folder
 if (this.lastMovedFolder.storageProvider === 'GoogleDrive') {
    this.directoryService.updateGooglePosition({
      externalId: id,
      name: name,
      x: x,
      y: y
    }).subscribe({
      complete: () => {
        this.lastMovedFolder = null;
      }
    });

    return;
  }

  // 🔥 Local folder
  this.directoryService.updatePosition(id, x, y).subscribe({
    complete: () => {
      this.lastMovedFolder = null;
    }
  });
}


  getBreadcrumbs() {
    const crumbs: any[] = [];
    const displayName = this.userState.username || this.username || 'User';

    crumbs.push({
      id: null,
      name: displayName,
      isRoot: true
    });

    if (!this.selectedFolderId || this.selectedFolderId === 'ROOT') {
      return crumbs;
    }

    const path: any[] = [];
    let currentId: string | null = this.selectedFolderId;
    let safetyCounter = 0;

    while (currentId && safetyCounter < 100) {
      const folder = this.directories.find(d => d.id === currentId);
      if (!folder) break;
      path.unshift({
        id: folder.id,
        name: folder.name,
        isRoot: false
      });
      currentId = folder.parentId;
      safetyCounter++;
    }

    return [...crumbs, ...path];
  }

  selectFolderFromBreadcrumb(crumb: any) {
 // Close sidebar on navigation
    if (crumb.isRoot) {
      this.rootOpen = true;
      this.selectedParentFolderId = null;
      this.selectedFolderId = null;
      this.activeFolder = null;
      this.currentFolderName = 'Root';
      this.showModelData = false;
      this.dataNodePosition = null;
      this.selectedFolderItems = [];
      return;
    }

    const dir = this.directories.find(d => d.id === crumb.id);
    if (!dir) return;

    // Ensure all parents are open
    let currentParentId = dir.parentId;
    let safety = 0;
    while (currentParentId && safety < 100) {
      const parent = this.directories.find(d => d.id === currentParentId);
      if (parent) {
        parent.isOpen = true;
        currentParentId = parent.parentId;
      } else {
        break;
      }
      safety++;
    }

    this.rootOpen = true;
    dir.isOpen = true; // Ensure target is open too

    this.selectedFolderId = dir.id;
    this.selectedParentFolderId = dir.id;
    this.currentFolderName = dir.name;
    this.activeFolder = dir;

    // Load files
    this.showModelData = false;
    this.dataNodePosition = null;
    this.selectedFolderItems = [];
    this.selectedFile = null;

    this.fileService.getFilesByNode(dir.id).subscribe({
      next: (files) => {
        this.selectedFolderItems = files ?? [];
        if (files && files.length > 0) {
          this.setDataNodePosition(dir);
          this.showModelData = true;
        }
      },
      error: () => {
        this.selectedFolderItems = [];
        this.showModelData = false;
        this.dataNodePosition = null;
      },
    });
  }

  private update() {
    this.checkRootVisibility();

    if (this.canvasContent) {
      this.canvasContent.nativeElement.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.canvasScale})`;
    }
    if (this.edgesGroup) {
      this.edgesGroup.nativeElement.setAttribute('transform', `translate(${this.x}, ${this.y}) scale(${this.canvasScale})`);
    }
    if (this.gridBackground) {
      this.gridBackground.nativeElement.style.backgroundPosition = `${this.x}px ${this.y}px`;
      this.gridBackground.nativeElement.style.backgroundSize = `${20 * this.canvasScale}px ${20 * this.canvasScale}px`;
    }
  }

  private checkRootVisibility() {
    const rootX = this.x + 2500 * this.canvasScale;
    const rootY = this.y + 2500 * this.canvasScale;
    
    // Check if (2500, 2500) is within viewport bounds with some padding
    const padding = 50;
    const isVisible = (
      rootX >= -padding && 
      rootX <= window.innerWidth + padding &&
      rootY >= -padding && 
      rootY <= window.innerHeight + padding
    );

    this.isRootOffScreen = !isVisible;
  }
}
