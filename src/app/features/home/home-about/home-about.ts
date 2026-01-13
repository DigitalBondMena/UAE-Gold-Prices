import { Component, input } from '@angular/core';
import { SectionTitle } from '../../../shared/components/section-title/section-title';
import { AppButton } from '../../../shared/components/app-button/app-button';
import { AboutHome } from '../../../core/models/home.model';

@Component({
  selector: 'app-home-about',
  imports: [SectionTitle, AppButton],
  templateUrl: './home-about.html',
  styleUrl: './home-about.css',
})
export class HomeAbout {
  aboutData = input<AboutHome | null>(null);
}
