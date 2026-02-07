import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
 constructor(private router: Router) {}

  openAbout() {
    // Already on about page
  }

  backToSignin() {
    this.router.navigate(['/signin']);
  }
}
