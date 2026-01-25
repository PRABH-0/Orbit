import { Component, Input } from '@angular/core';

@Component({
  selector: 'svg:g',   // 👈 VERY IMPORTANT
  standalone: true,
  templateUrl: './edge.html',
  styleUrl: './edge.css'
})
export class Edge {
  @Input() x1!: number;
  @Input() y1!: number;
  @Input() x2!: number;
  @Input() y2!: number;
}
