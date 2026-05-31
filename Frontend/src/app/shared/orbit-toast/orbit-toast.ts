import { Component, inject } from '@angular/core';
import { ToastService, OrbitToast } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orbit-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orbit-toast.html',
  styleUrl: './orbit-toast.css'
})
export class OrbitToastComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  remove(id: number) {
    this.toastService.remove(id);
  }
}
