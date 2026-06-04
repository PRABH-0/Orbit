import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { UserStateService } from '../services/user-state.service';
import { AuthService } from '../services/auth.service';
import { ProfileService, ProfileResponse } from '../services/profile.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.css'
})
export class ProfileSettings implements OnInit {
  // User Info
  username: string = '';
  email: string = '';
  profilePic: string = '';
  createdAt: string = '';
  userStatus: string = 'Offline';
  isAdmin: boolean = false;

  // Storage
  storageUsed: string = '0 Bytes';
  storageLimit: string = '100 MB';
  storagePercentage: number = 0;

  // Stats
  totalFolders: number = 0;
  totalFiles: number = 0;
  planName: string = 'Free';

  // UI State
  isLoading = true;
  hasError = false;

  constructor(
    private router: Router,
    private location: Location,
    public userState: UserStateService,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  async ngOnInit() {
    // First ensure user is authenticated
    const user: any = await this.authService.syncUser();
    if (!user) {
      this.router.navigate(['/signin']);
      return;
    }

    // Then fetch full profile from the new API
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.hasError = false;

    this.profileService.getProfile().subscribe({
      next: (profile: ProfileResponse) => {
        // User Info
        this.username = profile.username || '';
        this.email = profile.email || '';
        this.profilePic = profile.profilePictureUrl || '';
        this.createdAt = profile.createdAt;
        this.userStatus = profile.userStatus;
        this.isAdmin = profile.isAdmin;

        // Storage
        this.storageUsed = this.formatBytes(profile.storage.usedBytes);
        this.storageLimit = this.formatBytes(profile.storage.totalBytes);
        this.storagePercentage = Math.min(
          Math.round(profile.storage.usagePercentage),
          100
        );

        // Stats
        this.totalFolders = profile.stats.totalFolders;
        this.totalFiles = profile.stats.totalFiles;
        this.planName = profile.stats.planName;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Profile load failed:', err);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  redirectToLastUrl() {
    this.location.back();
  }

  navigateToPayment() {
    this.router.navigate(['/payment']);
  }
}
