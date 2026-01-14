import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, HostListener, inject, OnDestroy, OnInit, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { Carousel, CarouselPageEvent } from 'primeng/carousel';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { AboutHome, BannerSection, Department, HeroSlide, HomeResponse, LatestBlog } from '../../core/models/home.model';
import { ApiService } from '../../core/services/api-service';
import { HomeAbout } from './home-about/home-about';
import { HomeBlogs } from './home-blogs/home-blogs';
import { HomeCalculator } from './home-calculator/home-calculator';
import { HomeCategories } from './home-categories/home-categories';

interface CarouselItem {
  title: string;
  image: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, HomeAbout, HomeCategories, HomeCalculator, HomeBlogs, Carousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiService = inject(ApiService);

  // ViewChild to access carousel component
  carousel = viewChild<Carousel>('heroCarousel');

  // API Data Signals
  homeData = signal<HomeResponse | null>(null);

  // Signal to track selected (clicked) carousel image for background
  selectedImage = signal<string | null>(null);

  // Signals for tracking visible carousel items
  currentPage = signal(0);
  numVisible = signal(4);

  // Computed signals for each section
  bannerSection = computed<BannerSection | null>(() => this.homeData()?.bannerSection ?? null);
  
  heroSlides = computed<HeroSlide[]>(() => this.homeData()?.heroSection ?? []);

  // Carousel items computed from API
  // Ensures we have enough items to scroll by duplicating if needed
  carouselItems = computed<CarouselItem[]>(() => {
    const slides = this.heroSlides();
    const items: CarouselItem[] = slides.map(slide => ({
      title: slide.title,
      image: slide.main_image
    }));
    
    // If we have fewer items than needed for smooth scrolling, duplicate them
    const minItemsNeeded = 8; // At least 2x numVisible for smooth circular scroll
    if (items.length > 0 && items.length < minItemsNeeded) {
      const duplicatedItems = [...items];
      while (duplicatedItems.length < minItemsNeeded) {
        duplicatedItems.push(...items);
      }
      return duplicatedItems.slice(0, minItemsNeeded);
    }
    
    return items;
  });

  aboutHome = computed<AboutHome | null>(() => this.homeData()?.aboutHome ?? null);
  departments = computed<Department[]>(() => this.homeData()?.departments ?? []);
  latestBlogs = computed<LatestBlog[]>(() => this.homeData()?.latestBlogs ?? []);

  // Default hero background from API
  defaultHeroImage = computed(() => this.bannerSection()?.main_image ?? '');

  // Computed signal for visible range
  visibleRange = computed(() => {
    const start = this.currentPage();
    const end = start + this.numVisible() - 1;
    return { first: start, last: end };
  });

  // Carousel responsive options - each scrolls 1 item at a time
  readonly responsiveOptions = [
    { breakpoint: '9999px', numVisible: 4, numScroll: 1 },
    { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '991px', numVisible: 2, numScroll: 1 },
    { breakpoint: '575px', numVisible: 1, numScroll: 1 }
  ];

  ngOnInit(): void {
    this.updateNumVisible();
    this.fetchHomeData();
  }

  ngOnDestroy(): void {}

  @HostListener('window:resize')
  onResize(): void {
    this.updateNumVisible();
  }

  // Update numVisible based on current viewport
  private updateNumVisible(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const width = window.innerWidth;
    if (width < 575) {
      this.numVisible.set(1);
    } else if (width < 991) {
      this.numVisible.set(2);
    } else if (width < 1199) {
      this.numVisible.set(3);
    } else {
      this.numVisible.set(4);
    }
  }

  // Fetch home data from API
  private fetchHomeData(): void {
    this.apiService.get<HomeResponse>(API_END_POINTS.HOME).subscribe({
      next: (response) => {
        if (response) {
          this.homeData.set(response);
        }
      }
    });
  }

  // Check if item is first visible
  isFirstVisible(index: number): boolean {
    const totalItems = this.carouselItems().length;
    const firstVisible = this.visibleRange().first % totalItems;
    return index === firstVisible;
  }

  // Check if item is second visible (after first)
  isSecondVisible(index: number): boolean {
    const totalItems = this.carouselItems().length;
    const secondVisible = (this.visibleRange().first + 1) % totalItems;
    return index === secondVisible && this.numVisible() >= 3;
  }

  // Check if item is third visible (before last)
  isThirdVisible(index: number): boolean {
    const totalItems = this.carouselItems().length;
    const thirdVisible = (this.visibleRange().last - 1 + totalItems) % totalItems;
    return index === thirdVisible && this.numVisible() >= 4 && !this.isSecondVisible(index);
  }

  // Check if item is last visible
  isLastVisible(index: number): boolean {
    const totalItems = this.carouselItems().length;
    const lastVisible = this.visibleRange().last % totalItems;
    return index === lastVisible;
  }

  // Handle carousel page change
  onPageChange(event: CarouselPageEvent): void {
    this.currentPage.set(event.page ?? 0);
  }

  // Select image on click
  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  // Pause carousel on hover
  pauseCarousel(): void {
    this.carousel()?.stopAutoplay();
  }

  // Resume carousel on mouse leave
  resumeCarousel(): void {
    this.carousel()?.startAutoplay();
  }
}
