import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SectionTitle } from '../../shared/components/section-title/section-title';
import { ApiService } from '../../core/services/api-service';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { AboutResponse } from '../../core/models/about.model';

@Component({
  selector: 'app-about',
  imports: [HeroSection, SectionTitle],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About implements OnInit {
  private readonly apiService = inject(ApiService);

  // API Data Signal
  aboutData = signal<AboutResponse | null>(null);

  // Computed signals for each section
  bannerSection = computed(() => this.aboutData()?.bannerSection ?? null);
  vision = computed(() => this.aboutData()?.visions?.text ?? '');
  mission = computed(() => this.aboutData()?.misssions?.text ?? '');
  message = computed(() => this.aboutData()?.messages?.text ?? '');
  why = computed(() => this.aboutData()?.why?.text ?? '');

  // Hero section computed values
  heroTitle = computed(() => this.bannerSection()?.title ?? 'بوابتك لفهم الذهب والفضة والمعادن بوضوح');
  heroSubtitle = computed(() => this.bannerSection()?.text ?? 'اكتشف مقالات متجددة تغطي أسعار الذهب وحركة الأسواق ونصائح استثمارية تمنحك فهمًا أوضح للسوق.');
  heroImage = computed(() => this.bannerSection()?.main_image ?? '/images/hero/hero.webp');

  ngOnInit(): void {
    this.fetchAboutData();
  }

  private fetchAboutData(): void {
    this.apiService.get<AboutResponse>(API_END_POINTS.ABOUT).subscribe({
      next: (response) => {
        if (response) {
          this.aboutData.set(response);
        }
      }
    });
  }
}
