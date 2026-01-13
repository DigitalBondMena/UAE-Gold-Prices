// Home Page API Response Interface

export interface BannerSection {
  small_title: string | null;
  title: string;
  text: string;
  main_image: string;
  meta_title: string;
  meta_description: string;
  page_schema: string | null;
  page_name: string;
}

export interface HeroSlide {
  title: string;
  small_text: string;
  main_image: string;
  slug: string;
  publish_at_ar: string;
  is_active: boolean;
  hero_status: number;
}

export interface AboutHome {
  text: string;
  main_image: string;
}

export interface Department {
  name: string;
  slug: string;
  main_image: string;
  is_active: number;
}

export interface LatestBlog {
  title: string;
  small_text: string;
  main_image: string;
  slug: string;
  publish_at_ar: string | null;
  is_active: boolean;
  hero_status: number;
}

export interface HomeResponse {
  bannerSection: BannerSection;
  heroSection: HeroSlide[];
  aboutHome: AboutHome;
  departments: Department[];
  latestBlogs: LatestBlog[];
}
