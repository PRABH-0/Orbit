import { Component } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  templateUrl: './loader.html',
  styleUrls: ['./loader.css'],
})
export class Loader {
  constructor(public loader: LoaderService) {}
}