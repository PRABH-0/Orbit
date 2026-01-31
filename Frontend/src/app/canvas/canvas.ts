import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';

import { Header } from '../header/header';
import { Directory } from '../directory/directory';
import { Edge } from '../edge/edge';
import { ModelData } from '../model-data/model-data';
import { DirectoryService } from '../services/directory.service';
import { FileService } from '../services/file.service';


@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    Header,
    Directory,
    Edge,
    ModelData,
    FormsModule,
    NgFor,
    NgIf,
    CommonModule
  ],
  templateUrl: './canvas.html',
  styleUrl: './canvas.css'
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

  dataNodePosition: { x: number; y: number } | null = null;
  selectedImage: string | null = null;

  isAddFolderOpen = false;
  draftFolder: any = null;

  rootOpen = false;

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private x = -2500;
  private y = -2500;
showModelData = false;

  constructor(
    private directoryService: DirectoryService,
    private fileService: FileService
  ) {}

  // =========================
  // INIT
  // =========================
  ngOnInit() {
     this.username = localStorage.getItem('username');
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
      next: data => {
        this.directories = data.map(d => ({
          ...d,
          isOpen: false
        }));
      },
      error: err => {
        console.error('Failed to load directories', err);
      }
    });
  }

  // =========================
  // ADD FOLDER
  // =========================
  onAddFolder() {
    const parentId = this.selectedParentFolderId;

    const parent =
      !parentId
        ? { id: null, x: 2500, y: 2500 }
        : this.directories.find(d => d.id === parentId);

    if (!parent) return;

    if (parentId) parent.isOpen = true;
    else this.rootOpen = true;

    this.draftFolder = {
      name: 'New Folder',
      parentId: parent.id,
      x: parent.x + 120,
      y: parent.y + 120,
      isOpen: false,
      isDraft: true
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
      basePath: null
    };

    this.directoryService.createDirectory(payload).subscribe({
      next: created => {
        Object.assign(this.draftFolder, created);
        delete this.draftFolder.isDraft;
        this.draftFolder = null;
        this.isAddFolderOpen = false;
      },
      error: err => {
        console.error('Create folder failed', err);
      }
    });
  }
onAddItem() {
  if (!this.selectedFolderId) {
    console.warn('No folder selected → cannot add item');
    return;
  }

  this.headerFileInput.nativeElement.click();
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
        const dir = this.directories.find(d => d.id === this.selectedFolderId);
        if (dir) {
          this.setDataNodePosition(dir);
          this.showModelData = true;
        }
      }
    },
    error: err => {
      console.error('Header upload failed', err);
    }
  });
}

  cancelAddFolder() {
    if (!this.draftFolder) return;
    this.directories = this.directories.filter(d => d !== this.draftFolder);
    this.draftFolder = null;
    this.isAddFolderOpen = false;
  }

  // =========================
  // MOVE FOLDER
  // =========================
  onFolderMoved(dir: any, pos: { x: number; y: number }) {
    dir.x = pos.x;
    dir.y = pos.y;

    if (dir.id) {
      this.directoryService
        .updatePosition(dir.id, pos.x, pos.y)
        .subscribe();
    }

    if (this.selectedFolderId === dir.id && this.dataNodePosition) {
      this.setDataNodePosition(dir);
    }
  }
  
  getModelDataAnchor() {
  if (!this.dataNodePosition) return null;

  const WIDTH = 800;   // same as model-data width
  const HEIGHT = 580;  // same as model-data height

  return {
    x: this.dataNodePosition.x,
    y: this.dataNodePosition.y + HEIGHT / 2
  };
}
onFolderClick(dir: any) {
  this.selectedParentFolderId = dir.id;
  this.currentFolderName = dir.name;

  if (this.hasChildren(dir)) {
    this.toggleFolder(dir.id);
  }

  // toggle close if same folder
  if (this.selectedFolderId === dir.id) {
    this.closeModelData();
    return;
  }

  this.selectedFolderId = dir.id;

  this.fileService.getFilesByNode(dir.id).subscribe({
    next: files => {
      this.selectedFolderItems = files;

      if (files.length > 0) {
        // ✅ ONLY NOW show model-data
        this.setDataNodePosition(dir);
        this.showModelData = true;
      } else {
        // ❌ No files → no model-data
        this.showModelData = false;
        this.dataNodePosition = null;
      }
    },
    error: err => {
      console.error('Failed to load files', err);
      this.selectedFolderItems = [];
      this.showModelData = false;
      this.dataNodePosition = null;
    }
  });
}

  // =========================
  // TREE HELPERS
  // =========================
  hasChildren(dir: any): boolean {
    return this.directories.some(d => d.parentId === dir.id);
  }

  toggleFolder(id: string) {
    const folder = this.directories.find(d => d.id === id);
    if (!folder) return;
    folder.isOpen = !folder.isOpen;
    if (!folder.isOpen) this.closeAllChildren(folder.id);
  }

  closeAllChildren(parentId: string) {
    for (const child of this.directories.filter(d => d.parentId === parentId)) {
      child.isOpen = false;
      this.closeAllChildren(child.id);
    }
  }

  shouldShow(dir: any): boolean {
    if (!dir.parentId) return this.rootOpen;
    const parent = this.directories.find(d => d.id === dir.parentId);
    return !!parent?.isOpen;
  }

  toggleRoot() {
    this.rootOpen = !this.rootOpen;
    if (!this.rootOpen) {
      this.directories.forEach(d => d.isOpen = false);
      this.closeModelData();
    } else {
      this.currentFolderName = 'Root';
    }
  }

  // =========================
  // DATA NODE
  // =========================
  setDataNodePosition(dir: any) {
    const GAP = 160;
    const WIDTH = 800;
    const HEIGHT = 580;

    let x = dir.x + GAP;
    let y = dir.y - HEIGHT / 2;

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

    const parent = this.directories.find(d => d.id === dir.parentId);
    if (!parent || !parent.isOpen) continue;

    edges.push({ x1: parent.x, y1: parent.y, x2: dir.x, y2: dir.y });
  }

  // 🔥 NEW: Folder → ModelData edge
  if (this.selectedFolderId && this.dataNodePosition) {
    const folder = this.directories.find(d => d.id === this.selectedFolderId);
    const modelAnchor = this.getModelDataAnchor();

    if (folder && modelAnchor) {
      edges.push({
        x1: folder.x,
        y1: folder.y,
        x2: modelAnchor.x,
        y2: modelAnchor.y,
        isModelEdge: true
      });
    }
  }

  return edges;
}

  // =========================
  // IMAGE VIEW
  // =========================
  openImage(file: string) {
    this.selectedImage = file;
  }

  closeImage() {
    this.selectedImage = null;
  }
reloadFiles() {
  if (!this.selectedFolderId) return;

  const dir = this.directories.find(d => d.id === this.selectedFolderId);

  this.fileService.getFilesByNode(this.selectedFolderId).subscribe({
    next: files => {
      this.selectedFolderItems = files;

      // 🔥 re-sync position after data change
      if (dir && this.dataNodePosition) {
        this.setDataNodePosition(dir);
      }
    },
    error: err => {
      console.error('Failed to reload files', err);
    }
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
  }

  private update() {
    this.grid.nativeElement.style.transform =
      `translate(${this.x}px, ${this.y}px)`;
  }
}
