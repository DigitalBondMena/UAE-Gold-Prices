import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionTitle } from '../../../shared/components/section-title/section-title';
import { Department } from '../../../core/models/home.model';

@Component({
  selector: 'app-home-categories',
  imports: [SectionTitle, RouterLink],
  templateUrl: './home-categories.html',
  styleUrl: './home-categories.css',
})
export class HomeCategories {
  departments = input<Department[]>([]);
}
