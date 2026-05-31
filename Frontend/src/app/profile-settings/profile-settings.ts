import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { UserStateService } from '../services/user-state.service';
import { AuthService } from '../services/auth.service';
import { supabase } from '../supabase.client';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.css'
})
export class ProfileSettings implements OnInit {
  username: string = '';
  email: string = '';
  profilePic: string = '';
  storageUsed: string = '0 MB';
  storageLimit: string = '100 MB';
  storagePercentage: number = 0;
  isUpdating = false;

  constructor(
    private router: Router,
    private location: Location,
    public userState: UserStateService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const user: any = await this.authService.syncUser();
    if (user) {
      this.username = user.username || '';
      this.email = user.email || '';
      this.profilePic = user.profilePictureUrl || '';
      
      // Assuming these fields might be present in the backend user object
      // or providing defaults if not.
      const used = user.storageUsed || 0; // in bytes or MB
      const limit = user.storageLimit || 104857600; // default 100MB in bytes

      this.storageUsed = this.formatBytes(used);
      this.storageLimit = this.formatBytes(limit);
      this.storagePercentage = Math.min(Math.round((used / limit) * 100), 100);
    }
  }

  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  redirectToLastUrl() {
    this.location.back();
  }
}
