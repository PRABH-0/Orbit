import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Renderer2, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
    constructor(private renderer: Renderer2) {}
    ngOnInit() {
    // Add orbit-mode class to body
    this.renderer.addClass(document.body, 'orbit-mode');
    
    // Create and append background elements
    const background = this.renderer.createElement('div');
    this.renderer.addClass(background, 'orbit-background');
    
    const gridCanvas = this.renderer.createElement('div');
    this.renderer.addClass(gridCanvas, 'orbit-grid-canvas');
    
    const centerGravity = this.renderer.createElement('div');
    this.renderer.addClass(centerGravity, 'orbit-center-gravity');
    
    const centerGrid = this.renderer.createElement('div');
    this.renderer.addClass(centerGrid, 'orbit-center-grid');
    
    const edgeFade = this.renderer.createElement('div');
    this.renderer.addClass(edgeFade, 'orbit-edge-fade');
    
    this.renderer.appendChild(background, gridCanvas);
    this.renderer.appendChild(background, centerGravity);
    this.renderer.appendChild(background, centerGrid);
    this.renderer.appendChild(background, edgeFade);
    this.renderer.appendChild(document.body, background);
  }
}
