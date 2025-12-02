import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  meta_description: string;
  keywords: string[];
  author: string;
  date: string;
  featured_image: string;
  category: string;
  content: string;
}

export function getAllPosts(locale: 'en' | 'es' = 'en'): BlogPost[] {
  const postsDirectory = path.join(contentDirectory, locale);

  // Ensure directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || '',
        meta_description: data.meta_description || '',
        keywords: data.keywords || [],
        author: data.author || '',
        date: data.date || '',
        featured_image: data.featured_image || '',
        category: data.category || '',
        content,
      };
    });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getPostBySlug(slug: string, locale: 'en' | 'es' = 'en'): BlogPost | null {
  try {
    const postsDirectory = path.join(contentDirectory, locale);
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      meta_description: data.meta_description || '',
      keywords: data.keywords || [],
      author: data.author || '',
      date: data.date || '',
      featured_image: data.featured_image || '',
      category: data.category || '',
      content,
    };
  } catch (error) {
    return null;
  }
}

export function getAllPostSlugs(locale: 'en' | 'es' = 'en'): string[] {
  const postsDirectory = path.join(contentDirectory, locale);

  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));
}
