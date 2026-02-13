import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserStateService {

  username: string | null = null;
  avatarUrl: string | null = null;

  setUser(user: any) {
    this.username = user.username;
    this.avatarUrl = user.user_metadata?.avatar_url;
  }

  clear() {
    this.username = null;
    this.avatarUrl = null;
  }
}
