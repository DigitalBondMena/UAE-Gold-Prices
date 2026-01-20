import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { BlogItem, BlogsBannerSection, BlogsResponse } from '../../core/models/blogs.model';
import { ApiService } from '../../core/services/api-service';
import { SeoService } from '../../core/services/seo.service';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SectionTitle } from '../../shared/components/section-title/section-title';
import { BlogSearchPipe } from '../../shared/pipes/blog-search.pipe';

@Component({
  selector: 'app-blogs',
  imports: [HeroSection, SectionTitle, RouterLink, PaginatorModule, FormsModule, BlogSearchPipe],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
})
export class Blogs implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly seoService = inject(SeoService);
  private readonly router = inject(Router);

  // Data signals
  blogs = signal<BlogItem[]>([]);
  bannerSection = signal<BlogsBannerSection | null>(null);
  isLoading = signal(true);

  // Search & Filter
  searchInput = signal('');    // What user types in input
  searchQuery = signal('');    // Applied search filter
  selectedDepartment = signal('all');
  showSearchDropdown = signal(false);

  // Computed: Search suggestions based on input (blogs)
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
      .slice(0, 5); // Limit to 5 blog suggestions
  });

  // Computed: Department suggestions based on input
  departmentSuggestions = computed(() => {
    const query = this.searchInput().trim();
    if (!query || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    
    return this.departments()
      .filter(dept => 
        dept?.includes(query) ||
        dept?.toLowerCase().includes(queryLower)
      )
      .slice(0, 3); // Limit to 3 department suggestions
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.showSearchDropdown.set(false);
    }
  }

  // Computed: Extract unique departments from blogs
  departments = computed(() => {
    const allDepartments = this.blogs()
      .map(blog => blog.small_text)
      .filter(dept => dept && dept.trim() !== '');
    return [...new Set(allDepartments)];
  });

  // Pagination
  currentPage = signal(1);
  perPage = signal(9);
  totalRecords = signal(0);
  lastPage = signal(1);
  first = signal(0);

  ngOnInit(): void {
    this.loadBlogs(1);
    this.setSeoTags();
  }

  private setSeoTags(): void {
    this.seoService.updateMetaTags({
      title: 'المدونة - مقالات وأخبار الذهب',
      description: 'اقرأ أحدث المقالات والأخبار عن أسعار الذهب في الإمارات، نصائح الاستثمار في الذهب، تحليلات السوق، وتوقعات أسعار الذهب. مدونة متخصصة في عالم الذهب والمجوهرات.',
      keywords: 'مقالات الذهب, أخبار الذهب, مدونة أسعار الذهب, تحليل سوق الذهب, استثمار الذهب, gold news UAE, gold blog',
      canonicalUrl: `${this.seoService.getSiteUrl()}/blogs`,
      ogType: 'website'
    });
  }

  loadBlogs(page: number): void {
    this.isLoading.set(true);
    const endpoint = `${API_END_POINTS.BLOGS}?page=${page}`;

    this.apiService.get<BlogsResponse>(endpoint).subscribe({
      next: (response) => {
        if (response?.bannerSection) {
          this.bannerSection.set(response.bannerSection);
        }
        if (response?.blogs) {
          this.blogs.set(response.blogs.data);
          this.totalRecords.set(response.blogs.total);
          this.currentPage.set(response.blogs.current_page);
          this.perPage.set(response.blogs.per_page);
          this.lastPage.set(response.blogs.last_page);
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
    this.loadBlogs(page);
  }

  selectDepartment(department: string): void {
    this.selectedDepartment.set(department);
  }

  onSearch(): void {
    this.searchQuery.set(this.searchInput());
    this.showSearchDropdown.set(false);
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

  selectDepartmentSuggestion(department: string): void {
    this.selectedDepartment.set(department);
    this.searchInput.set('');
    this.searchQuery.set('');
    this.showSearchDropdown.set(false);
  }

  clearFilters(): void {
    this.searchInput.set('');
    this.searchQuery.set('');
    this.selectedDepartment.set('all');
    this.showSearchDropdown.set(false);
  }
}
