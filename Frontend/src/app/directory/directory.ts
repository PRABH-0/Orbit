import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-directory',
  imports: [],
  templateUrl: './directory.html',
  styleUrl: './directory.css',
})
export class Directory {
  @Input() name!: string;
  @Input() x!:number;
  @Input() y!:number;
  @Input() isClickable = false;

  @Output() clicked = new EventEmitter<void>();
  onClick() {
  this.clicked.emit();
}

}
