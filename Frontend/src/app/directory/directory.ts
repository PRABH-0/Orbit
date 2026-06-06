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

  @Output() clicked = new EventEmitter<void>();
  @Output() moved = new EventEmitter<{ x: number; y: number }>();

  private dragging = false;
  private offsetX = 0;
  private offsetY = 0;

  private startX = 0;
  private startY = 0;
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

    this.offsetX = event.clientX - this.x;
    this.offsetY = event.clientY - this.y;
  }

  onTouchStart(event: TouchEvent) {
    this.lastTouchTime = Date.now();
    event.stopPropagation();
    // We don't preventDefault here to allow potential browser gestures, 
    // but we use stopPropagation to avoid canvas dragging.

    this.dragging = true;
    this.hasMoved = false;

    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;

    this.offsetX = touch.clientX - this.x;
    this.offsetY = touch.clientY - this.y;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.dragging) return;
    if (Date.now() - this.lastTouchTime < 500) return;

    const dx = Math.abs(event.clientX - this.startX);
    const dy = Math.abs(event.clientY - this.startY);

    if (dx > 4 || dy > 4) {
      this.hasMoved = true;
    }

    if (this.hasMoved) {
      const newX = event.clientX - this.offsetX;
      const newY = event.clientY - this.offsetY;
      this.moved.emit({ x: newX, y: newY });
    }
  }

  onTouchMove(event: TouchEvent) {
    if (!this.dragging) return;

    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - this.startX);
    const dy = Math.abs(touch.clientY - this.startY);

    if (dx > 4 || dy > 4) {
      this.hasMoved = true;
    }

    if (this.hasMoved) {
      const newX = touch.clientX - this.offsetX;
      const newY = touch.clientY - this.offsetY;
      this.moved.emit({ x: newX, y: newY });
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
