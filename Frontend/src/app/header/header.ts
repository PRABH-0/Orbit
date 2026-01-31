import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [NgIf  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  @Input() currentFolder: string | null = null;
  @Input() username: string | null = null;
  @Output() addFolder = new EventEmitter<void>();
}
