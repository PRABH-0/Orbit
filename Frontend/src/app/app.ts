import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild
} from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import { Header } from './header/header';
import { Directory } from './directory/directory';
import { Edge } from './edge/edge';
import { ModelData } from './model-data/model-data';

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
    ModelData
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {

  @ViewChild('grid', { static: true }) grid!: ElementRef<HTMLDivElement>;
  @ViewChild('centerCircle', { static: true }) centerCircle!: ElementRef<HTMLDivElement>;
  
  @Output() imageOpen = new EventEmitter<string>();
  // ================= CANVAS DRAG =================
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private x = -2500;
  private y = -2500;

  rootOpen = false;
  selectedFolderId: string | null = null;

  // DATA NODE POSITION
  wallpaperDataNode: { x: number; y: number } | null = null;
  selectedImage: string | null = null;

  ngAfterViewInit() {
    this.update();
  }

  
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

  directories = [
    { id: 'documents', parentId: 'root', name: 'Documents', x: 2600, y: 2500, isOpen: false },
    { id: 'images', parentId: 'root', name: 'Images', x: 2500, y: 2600, isOpen: false },
    { id: 'music', parentId: 'root', name: 'Music', x: 2500, y: 2400, isOpen: false },

    { id: 'projects', parentId: 'documents', name: 'Projects', x: 2800, y: 2400, isOpen: false },
    { id: 'invoices', parentId: 'documents', name: 'Invoices', x: 2800, y: 2600, isOpen: false },

    { id: 'project-src', parentId: 'projects', name: 'SourceCode', x: 3000, y: 2400, isOpen: false },
    { id: 'project-docs', parentId: 'projects', name: 'Docs', x: 3000, y: 2500, isOpen: false },

    { id: 'wallpapers', parentId: 'images', name: 'Wallpapers', x: 2500, y: 2700, isOpen: false },
    { id: 'screenshots', parentId: 'images', name: 'Screenshots', x: 2300, y: 2600, isOpen: false },

    { id: 'classic', parentId: 'music', name: 'Classic', x: 2700, y: 2200, isOpen: false },
    { id: 'rock', parentId: 'music', name: 'Rock', x: 2700, y: 2300, isOpen: false },
    { id: 'classical', parentId: 'music', name: 'Classical', x: 2300, y: 2400, isOpen: false },
    { id: 'jass', parentId: 'music', name: 'Jass', x: 2300, y: 2300, isOpen: false },
  ];

  // ================= CLICK HANDLING =================
  onFolderClick(dir: any) {

    // Expand / collapse children
    if (this.hasChildren(dir)) {
      this.toggleFolder(dir.id);
    }

    // Open DATA NODE
    if (dir.id === 'wallpapers') {
      this.selectedFolderId = dir.id;
      this.setWallpaperDataNodePosition(dir);
    } else {
      this.selectedFolderId = null;
      this.wallpaperDataNode = null;
    }
  }

  hasChildren(dir: any): boolean {
    return this.directories.some(d => d.parentId === dir.id);
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

    if (!this.rootOpen) {
      this.directories.forEach(d => d.isOpen = false);
      this.selectedFolderId = null;
      this.wallpaperDataNode = null;
    }
  }

  // ================= SMART DATA NODE POSITION =================
  setWallpaperDataNodePosition(dir: any) {

    const ROOT_X = 2500;
    const ROOT_Y = 2500;

    let x = dir.x;
    let y = dir.y;

    // Vertical positioning
    if (dir.y > ROOT_Y) {
      y = dir.y + 220;     // below
    } else {
      y = dir.y - 540;     // above
    }

    // Horizontal positioning
    if (dir.x >= ROOT_X) {
      x = dir.x + 200;     // right
    } else {
      x = dir.x - 550;     // left
    }

    this.wallpaperDataNode = { x, y };
  }

  // ================= EDGES =================
  getVisibleEdges() {
    const edges: any[] = [];
    const ROOT_X = 2500;
    const ROOT_Y = 2500;

    for (const dir of this.directories) {

      // ROOT → CHILD
      if (dir.parentId === 'root') {
        if (!this.rootOpen) continue;

        edges.push({ x1: ROOT_X, y1: ROOT_Y, x2: ROOT_X, y2: dir.y });
        edges.push({ x1: ROOT_X, y1: dir.y, x2: dir.x, y2: dir.y });
        continue;
      }

      // NORMAL CHILD
      const parent = this.directories.find(d => d.id === dir.parentId);
      if (!parent || !parent.isOpen) continue;

      edges.push({ x1: parent.x, y1: parent.y, x2: parent.x, y2: dir.y });
      edges.push({ x1: parent.x, y1: dir.y, x2: dir.x, y2: dir.y });
    }

    // WALLPAPERS → DATA NODE EDGE
    if (this.selectedFolderId === 'wallpapers' && this.wallpaperDataNode) {
      const folder = this.directories.find(d => d.id === 'wallpapers');
      if (folder) {
        edges.push({
          x1: folder.x,
          y1: folder.y,
          x2: this.wallpaperDataNode.x,
          y2: this.wallpaperDataNode.y + 40
        });
      }
    }

    return edges;
  }

  // ================= DRAG =================
 @HostListener('mousedown', ['$event'])
onMouseDown(e: MouseEvent) {

  // ONLY left mouse button
  if (e.button !== 0) return;

  // Prevent browser drag / selection
  e.preventDefault();

  const rect = this.centerCircle.nativeElement.getBoundingClientRect();
  const insideCenter =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  // Do NOT drag if clicking center user
  if (insideCenter) return;

  this.isDragging = true;
  this.startX = e.clientX - this.x;
  this.startY = e.clientY - this.y;

  // 🔥 IMPORTANT
  document.body.style.userSelect = 'none';
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

  // restore selection
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
