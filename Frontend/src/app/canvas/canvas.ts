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
import { Profile } from '../profile/profile';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { supabase } from '../supabase.client';
import { UserStateService } from '../services/user-state.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [Header, Directory, Profile, Edge, ModelData, FormsModule, NgFor, NgIf, CommonModule],
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
})
export class Canvas implements OnInit, AfterViewInit {
  @ViewChild('grid', { static: true }) grid!: ElementRef<HTMLDivElement>;
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

  dataNodePosition: { x: number; y: number } | null = null;
  selectedFile: {
  type: 'image' | 'pdf' | 'video' | 'audio' | 'text';
  id: string;
  url?: string;
  safeUrl?: SafeUrl;
  content?: string;
  fileName?: string;
} | null = null;

  profilePic: string | null = null;

  isAddFolderOpen = false;
  draftFolder: any = null;
  showProfile = false;
  rootOpen = false;
  selectedFileId: string | null = null;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private x = -2500;
  private y = -2500;
  showModelData = false;
  cacheBuster = Date.now();
  constructor(
    private directoryService: DirectoryService,
    private fileService: FileService,
    private sanitizer: DomSanitizer,
    public userState:UserStateService,
    public auth : AuthService,
    private router: Router,
  ) {}

async ngOnInit() {
  const user: any = await this.auth.syncUser();

  if (!user) {
    this.router.navigate(['/signin']);
    return;
  }

  this.userState.setUser(user);
  this.loadDirectories();
}

  ngAfterViewInit() {
    this.update();
  }

  // =========================
  // LOAD FROM API
  // =========================
  loadDirectories() {
    this.directoryService.getDirectories().subscribe({
      next: (data) => {
        this.directories = data.map((d) => ({
          ...d,
          isOpen: false,
        }));
      },
      error: (err) => {
        console.error('Failed to load directories', err);
      },
    });
  }

  openUserMenu() {
    this.showProfile = !this.showProfile;
  }

  closeProfile() {
    this.showProfile = false;
  }


  payment() {
    this.router.navigate(['/payment']);
  }
  aboutpage() {
    this.router.navigate(['about']);
  }
  onDeleteFolder() {
    if (!this.selectedFolderId || !this.activeFolder) return;

    const confirmed = confirm(`Delete folder "${this.activeFolder.name}" and all its contents?`);

    if (!confirmed) return;

    const folderId = this.selectedFolderId;

    this.directoryService.deleteDirectory(folderId).subscribe({
      next: () => {
        // 🔥 Remove folder + children from canvas
        this.directories = this.directories.filter(
          (d) => d.id !== folderId && d.parentId !== folderId,
        );

        // 🔥 Reset UI state
        this.closeModelData();
        this.selectedFolderId = null;
        this.selectedParentFolderId = null;
        this.currentFolderName = null;
        this.activeFolder = null;

        // 🔥 Close any open tree nodes
        this.directories.forEach((d) => {
          if (d.parentId === folderId) {
            d.isOpen = false;
          }
        });
      },
      error: (err) => {
        console.error('Delete directory failed', err);
        alert('Failed to delete folder');
      },
    });
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
        this.draftFolder = null;
        this.isAddFolderOpen = false;
      },
      error: (err) => {
        console.error('Create folder failed', err);
      },
    });
  }
  onAddItem() {
    // Upload to root if no folder selected
    if (!this.selectedFolderId) {
      this.selectedFolderId = 'ROOT'; // or null if backend supports root
    }

    this.headerFileInput.nativeElement.click();
  }
async logout() {
  await this.auth.logout(this.router);
}

  onHeaderFileSelected(event: Event) {
    if (!this.selectedFolderId) return;

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    this.fileService.uploadFile(this.selectedFolderId, file).subscribe({
      next: () => {
        console.log('File uploaded from header');

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
      },
      error: (err) => {
        console.error('Header upload failed', err);
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

  deleteFile() {
    if (!this.selectedFile) return;

    if (!confirm('Delete this file?')) return;

    this.fileService.deleteFile(this.selectedFile.id).subscribe({
      next: () => {
        this.closeFileViewer();
        this.reloadFiles();
      },
      error: (err) => {
        console.error('Delete failed', err);
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
  onFolderClick(dir: any) {
  if (!dir || !dir.id) return;

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

  if (!this.rootOpen) {
    this.directories.forEach((d) => (d.isOpen = false));
    this.closeModelData();
    return;
  }

  this.selectedParentFolderId = null;
  this.selectedFolderId = null;
  this.activeFolder = null;
  this.currentFolderName = 'Root';

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
  if (payload.type === 'text') {
    this.selectedFile = payload;
    return;
  }

  // ✅ PDF only
  if (payload.type === 'pdf') {
    payload.safeUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(payload.url);
  }

  // ❌ NO sanitizer for audio/video
  this.selectedFile = payload;
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

  // =========================
  // CANVAS DRAG
  // =========================
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.folder-directory')) return;
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

    if (this.lastMovedFolder?.id) {
      const { id, x, y } = this.lastMovedFolder;

      this.directoryService.updatePosition(id, x, y).subscribe({
        complete: () => {
          this.lastMovedFolder = null;
        },
      });
    }
  }

  private update() {
    this.grid.nativeElement.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }
}
