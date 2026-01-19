import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {

  @ViewChild('grid', { static: true }) grid!: ElementRef<HTMLDivElement>;
  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLDivElement>;

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private x = -2500;
  private y = -2500;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.update();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    // Only start dragging on the viewport/grid area
    this.isDragging = true;
    this.startX = e.clientX - this.x;
    this.startY = e.clientY - this.y;
    
    // Add dragging class to viewport
    this.renderer.addClass(this.viewport.nativeElement, 'dragging');
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
    if (this.isDragging) {
      this.isDragging = false;
      // Remove dragging class from viewport
      this.renderer.removeClass(this.viewport.nativeElement, 'dragging');
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    // If mouse leaves the viewport while dragging, stop dragging
    if (this.isDragging) {
      this.isDragging = false;
      this.renderer.removeClass(this.viewport.nativeElement, 'dragging');
    }
  }

  /* Touch support */
  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    this.isDragging = true;
    this.startX = e.touches[0].clientX - this.x;
    this.startY = e.touches[0].clientY - this.y;
    this.renderer.addClass(this.viewport.nativeElement, 'dragging');
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault(); // Prevent scrolling on mobile
    this.x = e.touches[0].clientX - this.startX;
    this.y = e.touches[0].clientY - this.startY;
    this.update();
  }

  @HostListener('touchend')
  onTouchEnd() {
    this.isDragging = false;
    this.renderer.removeClass(this.viewport.nativeElement, 'dragging');
  }

  private update() {
    this.grid.nativeElement.style.transform =
      `translate(${this.x}px, ${this.y}px)`;
  }
}