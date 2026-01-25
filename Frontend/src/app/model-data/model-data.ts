import { Component, Input } from '@angular/core';
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

  // TEMP: list images manually (later this comes from API)
  items = [
    'image1.webp',
    'image2.webp',
    'image3.webp',
    'image4.webp',
    'image5.webp',
    'image6.webp',
    'image7.webp',
    'image8.webp',
    'image9.webp',
    'image10.webp',
    'image11.webp',
  ];

  getImagePath(file: string) {
    return `/imagesData/${file}`;
  }
}
