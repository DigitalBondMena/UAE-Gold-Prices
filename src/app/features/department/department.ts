import { Component, computed, effect, HostListener, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { BlogItem } from '../../core/models/blogs.model';
import { DepartmentBlogsResponse, Department as DepartmentModel } from '../../core/models/department.model';
import { ApiService } from '../../core/services/api-service';
import { SeoService } from '../../core/services/seo.service';
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
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  // Route input
  slug = input<string>('');

  // Data signals
  department = signal<DepartmentModel | null>(null);
  blogs = signal<BlogItem[]>([]);
  isLoading = signal(true);

  // Search
  searchInput = signal('');    // What user types in input
  searchQuery = signal('');    // Applied search filter
  showSearchDropdown = signal(false);

  // Computed: Search suggestions based on input
  searchSuggestions = computed(() => {
    const query = this.searchInput().trim();
    if (!query || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    
    return this.blogs()
      .filter(blog => 
        blog.title.includes(query) ||
        blog.title.toLowerCase().includes(queryLower) ||
        blog.small_text?.includes(query) ||
        blog.small_text?.toLowerCase().includes(queryLower)
      )
      .slice(0, 6); // Limit to 6 suggestions
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.showSearchDropdown.set(false);
    }
  }

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
      endpoint += `&search=${search}`;
    }

    this.apiService.get<DepartmentBlogsResponse>(endpoint).subscribe({
      next: (response) => {
        if (response?.department) {
          this.department.set(response.department);
          this.setSeoTags(response.department);
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
    
    this.searchQuery.set(this.searchInput());
    this.showSearchDropdown.set(false);
    this.first.set(0);
    this.loadDepartmentBlogs(slugValue, 1, this.searchQuery());
  }

  onSearchInputChange(value: string): void {
    this.searchInput.set(value);
    this.showSearchDropdown.set(value.length >= 2);
  }

  onSearchFocus(): void {
    if (this.searchInput().length >= 2) {
      this.showSearchDropdown.set(true);
    }
  }

  selectSuggestion(blog: BlogItem): void {
    this.showSearchDropdown.set(false);
    this.router.navigate(['/blog', blog.slug]);
  }

  private setSeoTags(department: DepartmentModel): void {
    // Use API meta values if available, otherwise generate defaults
    const title = department.meta_title ?? department.name;
    const description = department.meta_description
      ?? `تصفح جميع مقالات ${department.name} على موقع أسعار الذهب في الإمارات. اقرأ أحدث الأخبار والتحليلات المتعلقة بـ ${department.name}.`;

    this.seoService.updateMetaTags({
      title: title,
      description: description,
      keywords: `${department.name}, مقالات ${department.name}, أخبار الذهب, تحليلات الذهب`,
      canonicalUrl: `${this.seoService.getSiteUrl()}/department/${department.slug}`,
      ogType: 'website',
      ogImage: department.banner_image
    });
  }
}
