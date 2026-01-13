import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionTitle } from '../../../shared/components/section-title/section-title';
import { LatestBlog } from '../../../core/models/home.model';

@Component({
  selector: 'app-home-blogs',
  imports: [SectionTitle, RouterLink],
  templateUrl: './home-blogs.html',
  styleUrl: './home-blogs.css',
})
export class HomeBlogs {
  blogs = input<LatestBlog[]>([]);
}
