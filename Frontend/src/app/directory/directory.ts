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

  onClick(event: MouseEvent) {
    event.stopPropagation();
    this.clicked.emit();
  }

  onMouseDown(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.dragging = true;
    this.offsetX = event.clientX - this.x;
    this.offsetY = event.clientY - this.y;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.dragging) return;

    // 🔥 CALCULATE but DO NOT STORE locally
    const newX = event.clientX - this.offsetX;
    const newY = event.clientY - this.offsetY;

    this.moved.emit({ x: newX, y: newY });
  }

  onMouseUp() {
    this.dragging = false;
  }
}
