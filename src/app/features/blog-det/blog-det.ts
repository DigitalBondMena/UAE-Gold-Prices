import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  NgZone,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import {
  BlogDetail,
  BlogDetailsResponse,
  RelatedBlog,
} from '../../core/models/blog-details.model';
import { ApiService } from '../../core/services/api-service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

interface Section {
  id: string;
  title: string;
  content: string;
  index: number;
}

@Component({
  selector: 'app-blog-det',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe, RouterLink],
  templateUrl: './blog-det.html',
  styleUrl: './blog-det.css',
  encapsulation: ViewEncapsulation.None,
})
export class BlogDet {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  isBrowser = isPlatformBrowser(this.platformId);

  // ===== ROUTE INPUT =====
  slug = input.required<string>();

  // ===== DATA =====
  blog = signal<BlogDetail | null>(null);
  relatedBlogs = signal<RelatedBlog[]>([]);
  isLoading = signal(true);

  hasBlog = computed(() => !!this.blog());

  // ===== HERO IMAGE =====
  heroImage = computed(() => {
    const blogData = this.blog();
    if (!blogData) return '/images/blog.png';

    const imageSource = blogData.banner_image || blogData.main_image;

    if (typeof imageSource === 'string') {
      return imageSource;
    }

    if (Array.isArray(imageSource)) {
      return imageSource[2] ?? imageSource[0] ?? '/images/blog.png';
    }

    return '/images/blog.png';
  });

  // ===== SECTIONS =====
  sections = signal<Section[]>([]);
  activeSectionIndex = signal<number>(-1);

  activeSection = computed(() => {
    const index = this.activeSectionIndex();
    const sectionsList = this.sections();
    if (index >= 0 && index < sectionsList.length) {
      return sectionsList[index] ?? null;
    }
    return null;
  });

  fullContent = computed(() => {
    const activeIndex = this.activeSectionIndex();
    let html = this.blog()?.text ?? '';

    if (html) {
      const sectionsList = this.sections();
      html = html.replace(
        /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
        (match, attributes, content) => {
          const cleanContent = content.replace(/<[^>]*>/g, '').trim();

          const sectionIndex = sectionsList.findIndex((s) => {
            const cleanTitle = s.title.trim();
            return (
              cleanContent === cleanTitle ||
              cleanContent.includes(cleanTitle) ||
              cleanTitle.includes(cleanContent)
            );
          });

          const finalIndex = sectionIndex >= 0 ? sectionIndex : -1;

          let classAttr = '';
          if (finalIndex === activeIndex && finalIndex >= 0) {
            classAttr = ' class="section-heading-active"';
          } else {
            classAttr = ' class="section-heading"';
          }

          let newAttributes = attributes;
          if (finalIndex >= 0) {
            if (newAttributes.includes('id=')) {
              newAttributes = newAttributes.replace(
                /id="[^"]*"/,
                `id="section-${finalIndex}"`
              );
            } else {
              newAttributes = `${newAttributes} id="section-${finalIndex}"`;
            }
          }

          if (!newAttributes.includes('class=')) {
            newAttributes = `${newAttributes}${classAttr}`;
          } else {
            newAttributes = newAttributes.replace(
              /class="([^"]*)"/,
              (m: string, classes: string) => {
                return `class="${classes} ${finalIndex === activeIndex && finalIndex >= 0 ? 'section-heading-active' : 'section-heading'}"`;
              }
            );
          }

          return `<h2${newAttributes}>${content}</h2>`;
        }
      );

      // Clean up inline styles
      html = html.replace(/style\s*=\s*"([^"]*)"/gi, (match, styles) => {
        let cleanedStyles = styles.replace(
          /font-family\s*:\s*[^;]+;?\s*/gi,
          ''
        );
        cleanedStyles = cleanedStyles
          .replace(/;\s*;/g, ';')
          .replace(/^\s*;\s*|\s*;\s*$/g, '');
        return `style="${cleanedStyles}"`;
      });

      // Force justify text alignment
      html = html.replace(
        /style\s*=\s*"([^"]*)text-align\s*:\s*(left|right|center)([^"]*)"/gi,
        (match, before, align, after) => {
          const cleanedBefore = before.replace(
            /text-align\s*:\s*(left|right|center)\s*;?\s*/gi,
            ''
          );
          const cleanedAfter = after.replace(
            /text-align\s*:\s*(left|right|center)\s*;?\s*/gi,
            ''
          );
          return `style="${cleanedBefore}text-align: justify;${cleanedAfter}"`;
        }
      );

      html = html.replace(
        /text-align\s*:\s*(left|right|center)\s*;?/gi,
        'text-align: justify;'
      );
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  constructor() {
    // Watch slug input and load blog details
    effect(() => {
      const slugValue = this.slug();
      if (!slugValue) {
        this.router.navigate(['/blogs']);
        return;
      }
      this.loadBlogDetails(slugValue);
    });

    effect(() => {
      const html = this.blog()?.text;
      if (html) {
        this.extractSections(html);
      }
    });

    effect(() => {
      const activeIndex = this.activeSectionIndex();
      const sectionsList = this.sections();
      if (activeIndex >= 0 && sectionsList.length > 0 && this.isBrowser) {
        setTimeout(() => {
          sectionsList.forEach((section, index) => {
            const element = document.getElementById(`section-${index}`);
            if (element) {
              if (index === activeIndex) {
                element.classList.add('section-heading-active');
                element.classList.remove('section-heading');
              } else {
                element.classList.remove('section-heading-active');
                element.classList.add('section-heading');
              }
            }
          });
        }, 100);
      }
    });
  }

  // ===== API CALL =====
  loadBlogDetails(slug: string): void {
    this.isLoading.set(true);
    const endpoint = API_END_POINTS.BLOG_DETAILS.replace('{slug}', slug);

    this.apiService.get<BlogDetailsResponse>(endpoint).subscribe({
      next: (response) => {
        if (response?.blog) {
          this.blog.set(response.blog);
          this.relatedBlogs.set(response.related_blogs ?? []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  // ===== LOGIC =====
  extractSections(html: string): void {
    const result: Section[] = [];
    // Use 'gis' flags: g=global, i=case-insensitive, s=dotAll (. matches newlines)
    const regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    let match;

    const matches: { index: number; title: string }[] = [];
    while ((match = regex.exec(html)) !== null) {
      const title = match[1].replace(/<[^>]*>/g, '').trim();
      if (title) {
        matches.push({
          index: match.index,
          title: title,
        });
      }
    }

    if (matches.length === 0) {
      this.sections.set([]);
      this.activeSectionIndex.set(-1);
      return;
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = matches[i + 1]?.index ?? html.length;

      result.push({
        id: `sec-${i}`,
        title: matches[i].title,
        content: html.slice(start, end),
        index: i,
      });
    }

    this.sections.set(result);
    this.activeSectionIndex.set(0);
  }

  navigateToSection(i: number): void {
    if (i >= 0 && i < this.sections().length) {
      this.activeSectionIndex.set(i);
      if (this.isBrowser) {
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              const sectionId = `section-${i}`;
              let attempts = 0;
              const findAndScroll = () => {
                const targetElement = document.getElementById(sectionId);
                if (targetElement) {
                  requestAnimationFrame(() => {
                    const elementPosition =
                      targetElement.getBoundingClientRect().top;
                    const scrollY = window.pageYOffset;
                    const offsetPosition = elementPosition + scrollY - 120;

                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth',
                    });
                  });
                } else if (attempts < 5) {
                  attempts++;
                  setTimeout(findAndScroll, 100);
                }
              };
              findAndScroll();
            }, 200);
          });
        });
      }
    }
  }

  isSectionActive(index: number): boolean {
    const currentIndex = this.activeSectionIndex();
    return currentIndex >= 0 && currentIndex === index;
  }

  navigateToRelatedBlog(blog: RelatedBlog): void {
    this.router.navigate(['/blog', blog.slug]);
  }

  getResponsiveImage(images?: string[] | null): string {
    if (!images?.length) return '/images/placeholder.png';
    return images[2] ?? images[0];
  }

  getResponsiveImageFromObject(img: { desktop?: string; mobile?: string } | null): string {
    if (!img) return '/images/placeholder.png';
    return img.desktop ?? img.mobile ?? '/images/placeholder.png';
  }
}
