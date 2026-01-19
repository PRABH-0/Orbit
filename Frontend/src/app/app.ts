import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/header";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header ],
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

  ngAfterViewInit() {
    this.update();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    // Check if click is inside the center circle
    const centerCircleElement = this.centerCircle.nativeElement;
    const rect = centerCircleElement.getBoundingClientRect();
    
    // Calculate if click is within the center circle bounds
    const isClickInCenterCircle = 
      e.clientX >= rect.left && 
      e.clientX <= rect.right && 
      e.clientY >= rect.top && 
      e.clientY <= rect.bottom;
    
    // Only start dragging if NOT clicking on center circle
    if (!isClickInCenterCircle) {
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

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.isDragging) {
      this.isDragging = false;
      this.viewport.nativeElement.classList.remove('dragging');
    }
  }

  /* Touch support with same center circle check */
  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    if (e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const centerCircleElement = this.centerCircle.nativeElement;
    const rect = centerCircleElement.getBoundingClientRect();
    
    // Check if touch is inside the center circle
    const isTouchInCenterCircle = 
      touch.clientX >= rect.left && 
      touch.clientX <= rect.right && 
      touch.clientY >= rect.top && 
      touch.clientY <= rect.bottom;
    
    if (!isTouchInCenterCircle) {
      this.isDragging = true;
      this.startX = touch.clientX - this.x;
      this.startY = touch.clientY - this.y;
      this.viewport.nativeElement.classList.add('dragging');
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e: TouchEvent) {
    if (!this.isDragging || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.x = touch.clientX - this.startX;
    this.y = touch.clientY - this.startY;
    this.update();
  }

  @HostListener('touchend')
  onTouchEnd() {
    this.isDragging = false;
    this.viewport.nativeElement.classList.remove('dragging');
  }

  private update() {
    this.grid.nativeElement.style.transform =
      `translate(${this.x}px, ${this.y}px)`;
  }
}