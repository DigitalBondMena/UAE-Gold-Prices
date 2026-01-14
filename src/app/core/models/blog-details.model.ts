// Blog Details API Response Interface

export interface BlogImage {
  desktop: string;
  mobile: string;
}

export interface BlogDetail {
  title: string;
  small_text: string;
  text: string;
  slug: string;
  main_image: string;
  banner_image: string | BlogImage | string[];
  image: BlogImage | null;
  publish_at_ar: string | null;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  page_schema: string | null;
}

export interface RelatedBlog {
  title: string;
  slug: string;
  small_text: string;
  main_image: string;
  image: BlogImage | null;
  publish_at_ar: string | null;
}

export interface BlogDetailsResponse {
  blog: BlogDetail;
  related_blogs: RelatedBlog[];
}
