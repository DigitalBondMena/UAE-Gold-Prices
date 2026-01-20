import { CommonModule, DOCUMENT, isPlatformBrowser, isPlatformServer, NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, ElementRef, HostListener, inject, OnDestroy, OnInit, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Carousel, CarouselPageEvent } from 'primeng/carousel';
import { Skeleton } from 'primeng/skeleton';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { AboutHome, BannerSection, Department, HeroSlide, HomeResponse, LatestBlog } from '../../core/models/home.model';
import { ApiService } from '../../core/services/api-service';
import { SeoService } from '../../core/services/seo.service';
import { HomeAbout } from './home-about/home-about';
import { HomeBlogs } from './home-blogs/home-blogs';
import { HomeCalculator } from './home-calculator/home-calculator';
import { HomeCategories } from './home-categories/home-categories';

interface CarouselItem {
  title: string;
  smallText: string;
  image: string;
  slug: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgOptimizedImage, HomeAbout, HomeCategories, HomeCalculator, HomeBlogs, Carousel, Skeleton],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  private readonly document = inject(DOCUMENT);

  // ViewChild to access carousel component
  carousel = viewChild<Carousel>('heroCarousel');
  
  // ViewChild for hero text elements
  heroTitle = viewChild<ElementRef<HTMLHeadingElement>>('heroTitle');
  heroSubtitle = viewChild<ElementRef<HTMLParagraphElement>>('heroSubtitle');
  
  // Effect to restart text animations when selection changes (without forced reflow)
  private textAnimationEffect = effect(() => {
    const key = this.selectionKey();
    if (key > 0 && isPlatformBrowser(this.platformId)) {
      // Use requestAnimationFrame instead of triggering forced reflow
      requestAnimationFrame(() => {
        const titleEl = this.heroTitle()?.nativeElement;
        const subtitleEl = this.heroSubtitle()?.nativeElement;
        
        if (titleEl) {
          titleEl.classList.remove('hero-title-animate');
          requestAnimationFrame(() => {
            titleEl.classList.add('hero-title-animate');
          });
        }
        
        if (subtitleEl) {
          subtitleEl.classList.remove('hero-subtitle-animate');
          requestAnimationFrame(() => {
            subtitleEl.classList.add('hero-subtitle-animate');
          });
        }
      });
    }
  });

  // Loading state signal
  isLoading = signal(true);
  
  // Track if carousel images are preloaded
  imagesLoaded = signal(false);

  // API Data Signals
  homeData = signal<HomeResponse | null>(null);

  // Signal to track selected (clicked) carousel image for background
  selectedImage = signal<string | null>(null);
  
  // Signal for the previous image (used for crossfade)
  previousImage = signal<string | null>(null);
  
  // Signal to track selected blog slug for navigation
  selectedSlug = signal<string | null>(null);
  
  // Signals to track selected title and small text for hero display
  selectedTitle = signal<string | null>(null);
  selectedSmallText = signal<string | null>(null);
  
  // Unique key that changes on each selection to force re-render and restart animations
  selectionKey = signal(0);
  
  // Flag to control when new image is ready to show
  isNewImageReady = signal(false);

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
      smallText: slide.small_text,
      image: slide.main_image,
      slug: slide.slug
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
    this.setSeoTags();
  }

  private setSeoTags(): void {
    this.seoService.updateMetaTags({
      title: 'الرئيسية - أسعار الذهب اليومية',
      description: 'تابع أسعار الذهب اليومية في الإمارات العربية المتحدة. احصل على أحدث أسعار الذهب بجميع العيارات (24، 22، 21، 18) مع حاسبة الذهب وتحويل العملات. Gold prices in UAE updated daily.',
      keywords: 'أسعار الذهب, سعر الذهب اليوم, الذهب في الإمارات, gold price UAE, Dubai gold, أسعار الذهب دبي, عيار 24, عيار 22, عيار 21',
      canonicalUrl: this.seoService.getSiteUrl(),
      ogType: 'website'
    });
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
          
          // During SSR: Inject preload links for LCP images
          if (isPlatformServer(this.platformId)) {
            // Preload hero background image
            if (response.bannerSection?.main_image) {
              this.injectImagePreload(response.bannerSection.main_image, 'high');
            }
            // Preload first 4 carousel images for LCP discovery
            const carouselImages = response.heroSection?.slice(0, 4) ?? [];
            carouselImages.forEach((slide, index) => {
              if (slide.main_image) {
                this.injectImagePreload(slide.main_image, index === 0 ? 'high' : 'auto');
              }
            });
            // Keep loading true - client will handle actual preloading
            this.isLoading.set(true);
          } else {
            // On client: Preload carousel images before showing
            this.preloadCarouselImages(response.heroSection ?? []);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // Inject preload link for images during SSR for LCP optimization
  private injectImagePreload(imageUrl: string, priority: 'high' | 'auto' | 'low'): void {
    const link = this.document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imageUrl;
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }
    this.document.head.appendChild(link);
  }

  // Preload carousel images to prevent layout shift
  private preloadCarouselImages(slides: HeroSlide[]): void {
    if (slides.length === 0) {
      this.imagesLoaded.set(true);
      this.isLoading.set(false);
      return;
    }

    const imageUrls = slides.map(slide => slide.main_image);
    let loadedCount = 0;
    const totalImages = Math.min(imageUrls.length, 4); // Preload only first 4 visible images

    imageUrls.slice(0, totalImages).forEach(url => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          this.imagesLoaded.set(true);
          this.isLoading.set(false);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          this.imagesLoaded.set(true);
          this.isLoading.set(false);
        }
      };
      img.src = url;
    });

    // Fallback timeout to prevent infinite loading
    setTimeout(() => {
      if (this.isLoading()) {
        this.imagesLoaded.set(true);
        this.isLoading.set(false);
      }
    }, 5000);
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
  selectImage(item: CarouselItem): void {
    if (this.selectedImage() === item.image) return;
    
    // Store current image as previous for crossfade
    const currentImage = this.selectedImage();
    if (currentImage) {
      this.previousImage.set(currentImage);
    }
    
    // Reset ready state
    this.isNewImageReady.set(false);
    
    // Preload new image before showing
    if (isPlatformBrowser(this.platformId)) {
      const img = new Image();
      img.onload = () => {
        // Image loaded, now show it
        this.selectedImage.set(item.image);
        this.selectedSlug.set(item.slug);
        this.selectedTitle.set(item.title);
        this.selectedSmallText.set(item.smallText);
        this.selectionKey.update(k => k + 1);
        this.isNewImageReady.set(true);
        
        // Clear previous image after animation completes
        setTimeout(() => {
          this.previousImage.set(null);
        }, 800);
      };
      img.src = item.image;
    } else {
      // SSR fallback
      this.selectedImage.set(item.image);
      this.selectedSlug.set(item.slug);
      this.selectedTitle.set(item.title);
      this.selectedSmallText.set(item.smallText);
      this.selectionKey.update(k => k + 1);
    }
  }

  // Navigate to blog detail page
  navigateToBlog(): void {
    const slug = this.selectedSlug();
    if (slug) {
      this.router.navigate(['/blog', slug]);
    }
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
