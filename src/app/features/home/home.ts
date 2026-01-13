import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Carousel } from 'primeng/carousel';
import { HomeAbout } from './home-about/home-about';
import { HomeBlogs } from './home-blogs/home-blogs';
import { HomeCalculator } from './home-calculator/home-calculator';
import { HomeCategories } from './home-categories/home-categories';
import { ApiService } from '../../core/services/api-service';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { HomeResponse, HeroSlide, AboutHome, Department, LatestBlog, BannerSection } from '../../core/models/home.model';

@Component({
  selector: 'app-home',
  imports: [HomeAbout, HomeCategories, HomeCalculator, HomeBlogs, Carousel, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly apiService = inject(ApiService);

  // API Data Signals
  homeData = signal<HomeResponse | null>(null);
  
  // Fallback carousel items (when API has no data)
  private readonly fallbackSlides: HeroSlide[] = [
    { title: 'اتجاهات الذهب', small_text: '', main_image: '/images/hero/slider1.png', slug: '', publish_at_ar: '', is_active: true, hero_status: 1 },
    { title: 'وقت الشراء؟', small_text: '', main_image: '/images/hero/slider2.png', slug: '', publish_at_ar: '', is_active: true, hero_status: 1 },
    { title: 'تحليل الذهب اليوم', small_text: '', main_image: '/images/hero/slider3.png', slug: '', publish_at_ar: '', is_active: true, hero_status: 1 },
    { title: 'دليلك الكامل لفهم حركة الذهب', small_text: '', main_image: '/images/hero/slider4.png', slug: '', publish_at_ar: '', is_active: true, hero_status: 1 },
  ];

  // Computed signals for each section
  bannerSection = computed<BannerSection | null>(() => this.homeData()?.bannerSection ?? null);
  heroSlides = computed<HeroSlide[]>(() => {
    const apiSlides = this.homeData()?.heroSection ?? [];
    return apiSlides.length > 0 ? apiSlides : this.fallbackSlides;
  });
  aboutHome = computed<AboutHome | null>(() => this.homeData()?.aboutHome ?? null);
  departments = computed<Department[]>(() => this.homeData()?.departments ?? []);
  latestBlogs = computed<LatestBlog[]>(() => this.homeData()?.latestBlogs ?? []);

  // Signal to track hovered carousel image
  hoveredImage = signal<string | null>(null);

  // Default hero background (fallback)
  defaultHeroImage = computed(() => this.bannerSection()?.main_image ?? '/images/hero/hero.webp');

  // Carousel responsive options
  readonly responsiveOptions = [
    { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '991px', numVisible: 2, numScroll: 1 },
    { breakpoint: '575px', numVisible: 1, numScroll: 1 }
  ];

  ngOnInit(): void {
    this.fetchHomeData();
  }

  private fetchHomeData(): void {
    this.apiService.get<HomeResponse>(API_END_POINTS.HOME).subscribe({
      next: (response) => {
        if (response) {
          this.homeData.set(response);
        }
      }
    });
  }
}
