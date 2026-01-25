import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild
} from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

import { Header } from './header/header';
import { Directory } from './directory/directory';
import { Edge } from './edge/edge';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Directory, NgFor, NgIf, Edge],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {

  @ViewChild('grid', { static: true }) grid!: ElementRef<HTMLDivElement>;
  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLDivElement>;
  @ViewChild('centerCircle', { static: true }) centerCircle!: ElementRef<HTMLDivElement>;


  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private x = -2500;
  private y = -2500;
  rootOpen:boolean = false;

  ngAfterViewInit() {
    this.update();
  }


  directories = [
  // ===== ROOT LEVEL =====
  { id: 'documents', parentId: 'root', name: 'Documents', x: 2600, y: 2500, isOpen: false },
  { id: 'images', parentId: 'root', name: 'Images', x: 2500, y: 2600, isOpen: false },
  { id: 'music', parentId: 'root', name: 'Music', x: 2500, y: 2400, isOpen: false },

  // ===== DOCUMENTS CHILDREN =====
  { id: 'projects', parentId: 'documents', name: 'Projects', x: 2800, y: 2400, isOpen: false },
  { id: 'invoices', parentId: 'documents', name: 'Invoices', x: 2800, y: 2600, isOpen: false },

  // ===== PROJECTS CHILDREN =====
  { id: 'project-src', parentId: 'projects', name: 'SourceCode', x: 3000, y: 2400, isOpen: false },
  { id: 'project-docs', parentId: 'projects', name: 'Docs', x: 3000, y: 2500, isOpen: false },

  // ===== IMAGES CHILDREN =====
  { id: 'wallpapers', parentId: 'images', name: 'Wallpapers', x: 2500, y: 2700, isOpen: false },
  { id: 'screenshots', parentId: 'images', name: 'Screenshots', x: 2300, y: 2600, isOpen: false },

  // ===== MUSIC CHILDREN =====
  { id: 'classic', parentId: 'music', name: 'Classic', x: 2700, y: 2200, isOpen: false },
  { id: 'rock', parentId: 'music', name: 'Rock', x: 2700, y: 2300, isOpen: false },
  { id: 'classical', parentId: 'music', name: 'Classical', x: 2300, y: 2400, isOpen: false },
  { id: 'jass', parentId: 'music', name: 'Jass', x: 2300, y: 2300, isOpen: false },
];


  hasChildren(dir: any): boolean {
    return this.directories.some(d => d.parentId === dir.id);
  }

  toggleFolder(id: string) {
  const folder = this.directories.find(d => d.id === id);
  if (!folder) return;

  folder.isOpen = !folder.isOpen;

  // 🔒 if closing → close all descendants
  if (!folder.isOpen) {
    this.closeAllChildren(folder.id);
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
    for (const d of this.directories) {
      d.isOpen = false;
    }
  }
}
getVisibleEdges() {
  const edges: any[] = [];

  const ROOT_X = 2500;
  const ROOT_Y = 2500;

  for (const dir of this.directories) {

    // ---------- ROOT CHILD ----------
    if (dir.parentId === 'root') {
      if (!this.rootOpen) continue;

      // vertical from root to child
      edges.push({
        x1: ROOT_X,
        y1: ROOT_Y,
        x2: ROOT_X,
        y2: dir.y
      });

      // horizontal to child
      edges.push({
        x1: ROOT_X,
        y1: dir.y,
        x2: dir.x,
        y2: dir.y
      });

      continue;
    }

    // ---------- NORMAL CHILD ----------
    const parent = this.directories.find(d => d.id === dir.parentId);
    if (!parent || !parent.isOpen) continue;

    // vertical from parent to child
    edges.push({
      x1: parent.x,
      y1: parent.y,
      x2: parent.x,
      y2: dir.y
    });

    // horizontal to child
    edges.push({
      x1: parent.x,
      y1: dir.y,
      x2: dir.x,
      y2: dir.y
    });
  }

  return edges;
}

  closeAllChildren(parentId: string) {
  const children = this.directories.filter(d => d.parentId === parentId);

  for (const child of children) {
    child.isOpen = false;               // close child
    this.closeAllChildren(child.id);    // close grand-children
  }
}


  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    const rect = this.centerCircle.nativeElement.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!inside) {
      this.isDragging = true;
      this.startX = e.clientX - this.x;
      this.startY = e.clientY - this.y;
      this.viewport.nativeElement.classList.add('dragging');
    }
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
    this.viewport.nativeElement.classList.remove('dragging');
  }

  private update() {
    this.grid.nativeElement.style.transform =
      `translate(${this.x}px, ${this.y}px)`;
  }
}
