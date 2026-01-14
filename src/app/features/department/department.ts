import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { BlogItem } from '../../core/models/blogs.model';
import { Department as DepartmentModel, DepartmentBlogsResponse } from '../../core/models/department.model';
import { ApiService } from '../../core/services/api-service';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SectionTitle } from '../../shared/components/section-title/section-title';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [HeroSection, SectionTitle, RouterLink, PaginatorModule, FormsModule],
  templateUrl: './department.html',
  styleUrl: './department.css',
})
export class Department {
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Route input
  slug = input<string>('');

  // Data signals
  department = signal<DepartmentModel | null>(null);
  blogs = signal<BlogItem[]>([]);
  isLoading = signal(true);

  // Search
  searchQuery = signal('');

  // Pagination
  currentPage = signal(1);
  perPage = signal(9);
  totalRecords = signal(0);
  first = signal(0);

  // Computed
  hasDepartment = computed(() => !!this.department());
  heroImage = computed(() => this.department()?.banner_image || '/images/blog.png');
  departmentName = computed(() => this.department()?.name || 'المقالات');

  constructor() {
    // Watch for slug changes and load data
    effect(() => {
      const slugValue = this.slug();
      if (slugValue) {
        this.loadDepartmentBlogs(slugValue, 1);
      }
    });
  }

  loadDepartmentBlogs(slug: string, page: number, search?: string): void {
    this.isLoading.set(true);
    let endpoint = API_END_POINTS.DEPARTMENT_BLOGS.replace('{slug}', slug) + `?page=${page}`;

    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }

    this.apiService.get<DepartmentBlogsResponse>(endpoint).subscribe({
      next: (response) => {
        if (response?.department) {
          this.department.set(response.department);
        }
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
    const slugValue = this.slug();
    if (!slugValue) return;
    
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.perPage())) + 1;
    this.first.set(event.first ?? 0);
    this.loadDepartmentBlogs(slugValue, page, this.searchQuery());
  }

  onSearch(): void {
    const slugValue = this.slug();
    if (!slugValue) return;
    
    this.first.set(0);
    this.loadDepartmentBlogs(slugValue, 1, this.searchQuery());
  }
}
