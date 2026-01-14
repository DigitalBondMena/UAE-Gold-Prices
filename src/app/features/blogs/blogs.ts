import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { BlogItem, BlogsResponse } from '../../core/models/blogs.model';
import { ApiService } from '../../core/services/api-service';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SectionTitle } from '../../shared/components/section-title/section-title';

@Component({
  selector: 'app-blogs',
  imports: [HeroSection, SectionTitle, RouterLink, PaginatorModule, FormsModule],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
})
export class Blogs implements OnInit {
  private apiService = inject(ApiService);

  // Data signals
  blogs = signal<BlogItem[]>([]);
  isLoading = signal(true);

  // Search
  searchQuery = signal('');

  // Pagination
  currentPage = signal(1);
  perPage = signal(9);
  totalRecords = signal(0);
  first = signal(0);

  ngOnInit(): void {
    this.loadBlogs(1);
  }

  loadBlogs(page: number, search?: string): void {
    this.isLoading.set(true);
    let endpoint = `${API_END_POINTS.BLOGS}?page=${page}`;
    
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    
    this.apiService.get<BlogsResponse>(endpoint).subscribe({
      next: (response) => {
        if (response?.blogs) {
          this.blogs.set(response.blogs.data);
          this.totalRecords.set(response.blogs.total);
          this.currentPage.set(response.blogs.current_page);
          this.perPage.set(response.blogs.per_page);
          this.first.set((response.blogs.current_page - 1) * response.blogs.per_page);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onPageChange(event: PaginatorState): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.perPage())) + 1;
    this.first.set(event.first ?? 0);
    this.loadBlogs(page, this.searchQuery());
  }

  onSearch(): void {
    this.first.set(0);
    this.loadBlogs(1, this.searchQuery());
  }
}
