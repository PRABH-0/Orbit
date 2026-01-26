import { Component, EventEmitter, Input, Output } from '@angular/core';

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

  onMouseDown(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.dragging = true;
    this.hasMoved = false;

    this.startX = event.clientX;
    this.startY = event.clientY;

    this.offsetX = event.clientX - this.x;
    this.offsetY = event.clientY - this.y;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.dragging) return;

    const dx = Math.abs(event.clientX - this.startX);
    const dy = Math.abs(event.clientY - this.startY);

    // 🔥 drag threshold
    if (dx > 4 || dy > 4) {
      this.hasMoved = true;
    }

    if (this.hasMoved) {
      const newX = event.clientX - this.offsetX;
      const newY = event.clientY - this.offsetY;
      this.moved.emit({ x: newX, y: newY });
    }
  }

  onMouseUp(event: MouseEvent) {
    event.stopPropagation();

    // ✅ Only emit click if NO drag happened
    if (!this.hasMoved) {
      this.clicked.emit();
    }

    this.dragging = false;
  }
}
