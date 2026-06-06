import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-directory',
  standalone: true,
  templateUrl: './directory.html',
  styleUrl: './directory.css',
})
export class Directory {

  @Input() name!: string;
  @Input() x!: number;
  @Input() y!: number;
  @Input() scale: number = 1;

  @Output() clicked = new EventEmitter<void>();
  @Output() moved = new EventEmitter<{ x: number; y: number }>();

  private dragging = false;

  private startX = 0;
  private startY = 0;
  private initialX = 0;
  private initialY = 0;
  private hasMoved = false;

  private lastTouchTime = 0;

  onMouseDown(event: MouseEvent) {
    if (Date.now() - this.lastTouchTime < 500) return;
    event.stopPropagation();
    event.preventDefault();

    this.dragging = true;
    this.hasMoved = false;

    this.startX = event.clientX;
    this.startY = event.clientY;
    this.initialX = this.x;
    this.initialY = this.y;
  }

  onTouchStart(event: TouchEvent) {
    this.lastTouchTime = Date.now();
    event.stopPropagation();

    this.dragging = true;
    this.hasMoved = false;

    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.initialX = this.x;
    this.initialY = this.y;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.dragging) return;
    if (Date.now() - this.lastTouchTime < 500) return;

    const dx = (event.clientX - this.startX) / this.scale;
    const dy = (event.clientY - this.startY) / this.scale;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      this.hasMoved = true;
    }

    if (this.hasMoved) {
      this.moved.emit({ x: this.initialX + dx, y: this.initialY + dy });
    }
  }

  onTouchMove(event: TouchEvent | any) {
    if (!this.dragging) return;

    const touch = event.touches[0];
    const dx = (touch.clientX - this.startX) / this.scale;
    const dy = (touch.clientY - this.startY) / this.scale;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      this.hasMoved = true;
    }

    if (this.hasMoved) {
      this.moved.emit({ x: this.initialX + dx, y: this.initialY + dy });
    }
  }

  onMouseUp(event: MouseEvent) {
    if (Date.now() - this.lastTouchTime < 500) return;
    event.stopPropagation();

    if (this.dragging && !this.hasMoved) {
      this.clicked.emit();
    }

    this.dragging = false;
  }

  onTouchEnd(event: TouchEvent) {
    event.stopPropagation();
    // Prevent emulated mouse events
    event.preventDefault();

    if (this.dragging && !this.hasMoved) {
      this.clicked.emit();
    }

    this.dragging = false;
  }
@HostListener('document:mouseup')
onDocumentMouseUp() {
  this.dragging = false;
}

}
