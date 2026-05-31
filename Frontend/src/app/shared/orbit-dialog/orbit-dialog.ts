import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { DialogService, OrbitDialogConfig } from '../../services/dialog.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orbit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orbit-dialog.html',
  styleUrl: './orbit-dialog.css'
})
export class OrbitDialogComponent implements AfterViewChecked {
  config: OrbitDialogConfig | null = null;
  promptValue: string = '';
  @ViewChild('promptInput') promptInput?: ElementRef<HTMLInputElement>;

  constructor(private dialogService: DialogService) {
    this.dialogService.dialog$.subscribe(config => {
      this.config = config;
      if (config?.type === 'prompt') {
        this.promptValue = config.placeholder || '';
      }
    });
  }

  ngAfterViewChecked() {
    if (this.config?.type === 'prompt' && this.promptInput) {
      this.promptInput.nativeElement.focus();
    }
  }

  resolve(value: any) {
    if (this.config?.resolve) {
      this.config.resolve(value);
    }
  }

  confirm() {
    if (this.config?.type === 'prompt') {
      this.resolve(this.promptValue);
    } else if (this.config?.type === 'confirm') {
      this.resolve(true);
    } else {
      this.resolve(null);
    }
  }

  cancel() {
    if (this.config?.type === 'confirm') {
      this.resolve(false);
    } else {
      this.resolve(null);
    }
  }
}
