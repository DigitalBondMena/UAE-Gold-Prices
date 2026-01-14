// Blogs Page API Response Interface

export interface BlogItem {
  title: string;
  small_text: string;
  main_image: string;
  slug: string;
  publish_at_ar: string | null;
  is_active: boolean;
  hero_status: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface BlogsPagination {
  current_page: number;
  data: BlogItem[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface BlogsBannerSection {
  small_title: string | null;
  title: string | null;
  text: string | null;
  main_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  page_schema: string | null;
  page_name: string;
}

export interface BlogsResponse {
  bannerSection: BlogsBannerSection;
  blogs: BlogsPagination;
}
