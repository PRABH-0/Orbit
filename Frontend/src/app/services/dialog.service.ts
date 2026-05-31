import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface OrbitDialogConfig {
  type: 'alert' | 'confirm' | 'prompt' | 'loading';
  title?: string;
  message?: string;
  placeholder?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  resolve?: (value: any) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialogSubject = new BehaviorSubject<OrbitDialogConfig | null>(null);
  dialog$ = this.dialogSubject.asObservable();

  alert(message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info'): Promise<void> {
    return new Promise(resolve => {
      this.dialogSubject.next({ 
        type: 'alert', 
        message, 
        variant, 
        resolve: () => {
          this.close();
          resolve();
        }
      });
    });
  }

  confirm(title: string, message: string): Promise<boolean> {
    return new Promise(resolve => {
      this.dialogSubject.next({ 
        type: 'confirm', 
        title, 
        message, 
        resolve: (result: boolean) => {
          this.close();
          resolve(result);
        }
      });
    });
  }

  prompt(title: string, placeholder: string = ''): Promise<string | null> {
    return new Promise(resolve => {
      this.dialogSubject.next({ 
        type: 'prompt', 
        title, 
        placeholder, 
        resolve: (result: string | null) => {
          this.close();
          resolve(result);
        }
      });
    });
  }

  loading(message: string) {
    this.dialogSubject.next({ type: 'loading', message });
  }

  close() {
    this.dialogSubject.next(null);
  }
}
