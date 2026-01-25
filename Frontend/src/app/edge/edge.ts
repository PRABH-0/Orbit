import { Directive, Input, ElementRef, OnChanges } from '@angular/core';

@Directive({
  selector: '[appEdge]',
  standalone: true
})
export class Edge implements OnChanges {
  @Input() x1!: number;
  @Input() y1!: number;
  @Input() x2!: number;
  @Input() y2!: number;

  constructor(private el: ElementRef<SVGLineElement>) {}

  ngOnChanges() {
    const line = this.el.nativeElement;
    line.setAttribute('x1', String(this.x1));
    line.setAttribute('y1', String(this.y1));
    line.setAttribute('x2', String(this.x2));
    line.setAttribute('y2', String(this.y2));
    line.setAttribute('stroke', 'rgba(121, 136, 158, 0.9)');
    line.setAttribute('stroke-width', '2');
  }
}
