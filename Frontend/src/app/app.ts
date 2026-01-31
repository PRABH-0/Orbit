import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loader } from './shared/loader/loader';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,Loader],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  
}
