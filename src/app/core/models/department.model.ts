// Department Blogs API Response Interface

import { BlogItem, BlogsPagination } from './blogs.model';

export interface DepartmentListItem {
  name: string;
  slug: string;
  is_active: number;
}

export interface DepartmentsListResponse {
  departments: DepartmentListItem[];
}

export interface Department {
  name: string;
  slug: string;
  is_active: number;
  main_image: string;
  banner_image: string;
  faq_schema: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface DepartmentBlogsResponse {
  department: Department;
  blogs: BlogsPagination;
}
