import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStateService {

  username: string | null = null;
  avatarUrl: string | null = null;

  setUser(user: any) {
    this.username = user.username;
    this.avatarUrl = user.profilePictureUrl;
  }

  clear() {
    this.username = null;
    this.avatarUrl = null;
  }
}
