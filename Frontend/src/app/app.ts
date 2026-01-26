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

import { RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import { Header } from './header/header';
import { Directory } from './directory/directory';
import { Edge } from './edge/edge';
import { ModelData } from './model-data/model-data';

// ✅ TEMP DATA (later replace with API)
import dummyData from './dummydata.json';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    Directory,
    NgFor,
    NgIf,
    Edge,
    ModelData,
FormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit {

  /* ================== VIEW REFERENCES ================== */
  @ViewChild('grid', { static: true }) grid!: ElementRef<HTMLDivElement>;
  @ViewChild('centerCircle', { static: true }) centerCircle!: ElementRef<HTMLDivElement>;

  @Output() imageOpen = new EventEmitter<string>();
selectedParentFolderId: string | null = null;

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private x = -2500;
  private y = -2500;
isAddFolderOpen = false;
draftFolder: any = null;

  /* ================== UI STATE ================== */
  rootOpen = false;
  selectedFolderId: string | null = null;
  currentFolderName: string | null = null;

  dataNodePosition: { x: number; y: number } | null = null;
  selectedImage: string | null = null;

  /* ================== DATA ================== */
  apiData: any;
  directories: any[] = [];

  /* ================== INIT ================== */
  ngOnInit() {
    // ✅ load dummy JSON as API
    this.apiData = dummyData;

    // add runtime properties
    this.directories = this.apiData.directories.map((d: any) => ({
      ...d,
      isOpen: false
    }));
  }

  ngAfterViewInit() {
    this.update();
  }
onAddFolder() {

  const parentId = this.selectedParentFolderId ?? 'root';

  const parent =
    parentId === 'root'
      ? { id: 'root', x: 2500, y: 2500 }
      : this.directories.find(d => d.id === parentId);

  if (!parent) return;

  // 🔥 IMPORTANT: force parent open
  if (parentId !== 'root') {
    parent.isOpen = true;
  } else {
    this.rootOpen = true;
  }

  const draft = {
    id: this.generateId(),
    parentId: parent.id,
    name: 'New Folder',
    x: parent.x + 120,
    y: parent.y + 120,
    isOpen: false,
    isDraft: true
  };

  this.directories.push(draft);
  this.draftFolder = draft;
  this.isAddFolderOpen = true;
}


  get selectedFolderData() {
    if (!this.selectedFolderId) return null;
    return this.directories.find(
      d => d.id === this.selectedFolderId && d.items
    );
  }
saveAddFolder() {
  if (!this.draftFolder) return;

  delete this.draftFolder.isDraft;
  this.draftFolder = null;
  this.isAddFolderOpen = false;
}

cancelAddFolder() {
  if (!this.draftFolder) return;

  this.directories = this.directories.filter(
    d => d.id !== this.draftFolder.id
  );

  this.draftFolder = null;
  this.isAddFolderOpen = false;
}

  hasChildren(dir: any): boolean {
    return this.directories.some(d => d.parentId === dir.id);
  }

 
generateId(): string {
  return 'folder_' + Math.random().toString(36).substring(2, 9);
}

onFolderClick(dir: any) {

  // 🔑 ALWAYS set parent selection first
  this.selectedParentFolderId = dir.id;
  this.currentFolderName = dir.name;

  // toggle tree
  if (this.hasChildren(dir)) {
    this.toggleFolder(dir.id);
  }

  // toggle same folder (deselect)
  if (this.selectedFolderId === dir.id) {
    this.selectedFolderId = null;
    this.dataNodePosition = null;
    return;
  }

  // open model-data only if folder has items
  if (dir.items) {
    this.selectedFolderId = dir.id;
    this.setDataNodePosition(dir);
  } else {
    this.selectedFolderId = null;
    this.dataNodePosition = null;
  }
}



  toggleFolder(id: string) {
    const folder = this.directories.find(d => d.id === id);
    if (!folder) return;

    folder.isOpen = !folder.isOpen;

    if (!folder.isOpen) {
      this.closeAllChildren(folder.id);
    }
  }

  closeAllChildren(parentId: string) {
    const children = this.directories.filter(d => d.parentId === parentId);
    for (const child of children) {
      child.isOpen = false;
      this.closeAllChildren(child.id);
    }
  }

  shouldShow(dir: any): boolean {
    if (dir.parentId === 'root') {
      return this.rootOpen;
    }
    const parent = this.directories.find(d => d.id === dir.parentId);
    return !!parent?.isOpen;
  }
toggleRoot() {
  this.rootOpen = !this.rootOpen;

  if (this.rootOpen) {
    this.selectedParentFolderId = 'root';   // ✅ allow root as parent
    this.currentFolderName = 'Root';
  } else {
    this.currentFolderName = null;

    this.directories.forEach(d => d.isOpen = false);
    this.selectedFolderId = null;
    this.dataNodePosition = null;
  }
}


  /* ================== POSITION LOGIC ================== */

  setDataNodePosition(dir: any) {
    const ROOT_X = 2500;
    const ROOT_Y = 2500;

    const CONTAINER_WIDTH = 800;
    const CONTAINER_HEIGHT = 580;
    const GAP = 60;

    let x = dir.x;
    let y = dir.y;

    const dx = dir.x - ROOT_X;
    const dy = dir.y - ROOT_Y;

    if (Math.abs(dx) > Math.abs(dy)) {
      x = dx > 0
        ? dir.x + GAP
        : dir.x - CONTAINER_WIDTH - GAP;
      y = dir.y - CONTAINER_HEIGHT / 2;
    } else {
      y = dy > 0
        ? dir.y + GAP
        : dir.y - CONTAINER_HEIGHT - GAP;
      x = dir.x - CONTAINER_WIDTH / 2;
    }

    this.dataNodePosition = { x, y };
  }

  /* ================== EDGE LOGIC ================== */

  getVisibleEdges() {
    const edges: any[] = [];
    const ROOT_X = 2500;
    const ROOT_Y = 2500;

    for (const dir of this.directories) {

      if (dir.parentId === 'root') {
        if (!this.rootOpen) continue;

        edges.push({ x1: ROOT_X, y1: ROOT_Y, x2: ROOT_X, y2: dir.y });
        edges.push({ x1: ROOT_X, y1: dir.y, x2: dir.x, y2: dir.y });
        continue;
      }

      const parent = this.directories.find(d => d.id === dir.parentId);
      if (!parent || !parent.isOpen) continue;

      edges.push({ x1: parent.x, y1: parent.y, x2: parent.x, y2: dir.y });
      edges.push({ x1: parent.x, y1: dir.y, x2: dir.x, y2: dir.y });
    }

    if (this.selectedFolderData && this.dataNodePosition) {
      const folder = this.directories.find(d => d.id === this.selectedFolderId);
      if (folder) {
        edges.push({
          x1: folder.x,
          y1: folder.y,
          x2: this.dataNodePosition.x,
          y2: this.dataNodePosition.y + 40
        });
      }
    }

    return edges;
  }

  /* ================== IMAGE VIEWER ================== */

  openImage(file: string) {
    this.selectedImage = file;
  }

  closeImage() {
    this.selectedImage = null;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeImage();
  }
@HostListener('mousedown', ['$event'])
onMouseDown(e: MouseEvent) {

  const target = e.target as HTMLElement;

  // ✅ DO NOT drag when clicking UI elements
  if (
    target.closest('.add-folder-modal') ||
    target.closest('.data-node')
  ) {
    return;
  }

  if (e.button !== 0) return;

  e.preventDefault();

  const rect = this.centerCircle.nativeElement.getBoundingClientRect();
  const insideCenter =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (insideCenter) return;

  this.isDragging = true;
  this.startX = e.clientX - this.x;
  this.startY = e.clientY - this.y;

  document.body.style.userSelect = 'none';
}
closeModelData() {
  this.selectedFolderId = null;
  this.dataNodePosition = null;
}



  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    e.preventDefault();
    this.x = e.clientX - this.startX;
    this.y = e.clientY - this.startY;
    this.update();
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.isDragging = false;
    document.body.style.userSelect = '';
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isDragging = false;
    document.body.style.userSelect = '';
  }

  private update() {
    this.grid.nativeElement.style.transform =
      `translate(${this.x}px, ${this.y}px)`;
  }
}
