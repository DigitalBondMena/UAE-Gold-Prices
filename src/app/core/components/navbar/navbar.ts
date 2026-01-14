import { isPlatformBrowser } from '@angular/common';
import { Component, HostListener, inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppButton } from '../../../shared/components/app-button/app-button';
import { ApiService } from '../../services/api-service';
import { API_END_POINTS } from '../../constant/ApiEndPoints';
import { DepartmentListItem, DepartmentsListResponse } from '../../models/department.model';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, AppButton],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isMobileDepartmentsOpen = signal(false);
  departments = signal<DepartmentListItem[]>([]);
  
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);
  private throttledScrollHandler?: () => void;
  private resizeHandler?: () => void;

  ngOnInit(): void {
    // Fetch departments
    this.loadDepartments();
    
    if (this.isBrowser) {
      // Run scroll handler outside Angular's change detection to reduce reflow
      // this.throttledScrollHandler () => {
      //   this.ngZone.runOutsideAngular(() => {
      //     requestAnimationFrame(() => {
      //       const scrollPosition = window.scrollY;
      //       // Check if screen is medium or larger (md breakpoint = 768px)
      //       const isLargeScreen = window.innerWidth >= 768;
      //       // Only update signal inside Angular zone and only on large screens
      //       this.ngZone.run(() => {
      //         this.isScrolled.set(isLargeScreen && scrollPosition > 100);
      //       });
      //     });
      //   });
      // });
      
      // Use passive event listener for better scroll performance
      // window.addEventListener('scroll', this.throttledScrollHandler, { passive: true });
      
      // Handle window resize to reset scroll state when switching to small screen
      this.resizeHandler = () => {
        this.ngZone.run(() => {
          const isLargeScreen = window.innerWidth >= 768;
          if (!isLargeScreen) {
            this.isScrolled.set(false);
          }
        });
      };
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  loadDepartments(): void {
    this.apiService.get<DepartmentsListResponse>(API_END_POINTS.DEPARTMENTS).subscribe({
      next: (response) => {
        if (response?.departments) {
          // Filter only active departments
          const activeDepartments = response.departments.filter(dept => dept.is_active === 1);
          this.departments.set(activeDepartments);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.throttledScrollHandler) {
        window.removeEventListener('scroll', this.throttledScrollHandler);
      }
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
    }
  }

  // Keep @HostListener for backward compatibility but make it no-op in browser
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Handler moved to ngOnInit with better performance
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    this.isMobileDepartmentsOpen.set(false);
  }

  toggleMobileDepartments() {
    this.isMobileDepartmentsOpen.update(value => !value);
  }
}
