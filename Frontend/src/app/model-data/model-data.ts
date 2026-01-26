import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-model-data',
  standalone: true,
  imports: [NgFor],
  templateUrl: './model-data.html',
  styleUrl: './model-data.css',
})
export class ModelData {

  @Input() x!: number;
  @Input() y!: number;

  // 🔥 NEW
  @Input() title = '';
  @Input() items: string[] = [];
  @Input() basePath = '';

  @Output() imageOpen = new EventEmitter<string>();

  getImagePath(file: string): string {
    return `${this.basePath}/${file}`;
  }

  openImage(file: string): void {
    this.imageOpen.emit(file);
  }
}
