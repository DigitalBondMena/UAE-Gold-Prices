import { Pipe, PipeTransform } from '@angular/core';
import { BlogItem } from '../../core/models/blogs.model';

@Pipe({
  name: 'blogSearch',
  standalone: true,
  pure: true
})
export class BlogSearchPipe implements PipeTransform {
  transform(
    blogs: BlogItem[],
    searchQuery: string,
    selectedDepartment: string
  ): BlogItem[] {
    if (!blogs || blogs.length === 0) {
      return [];
    }

    let filteredBlogs = [...blogs];

    // Filter by search query (title)
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filteredBlogs = filteredBlogs.filter(blog =>
        blog.title.toLowerCase().includes(query)
      );
    }

    // Filter by department (small_text)
    if (selectedDepartment && selectedDepartment !== 'all') {
      filteredBlogs = filteredBlogs.filter(blog =>
        blog.small_text === selectedDepartment
      );
    }

    return filteredBlogs;
  }
}
