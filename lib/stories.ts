import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content/stories');

export interface Story {
  slug: string;
  title: string;
  name: string;
  age: number;
  country: string;
  occupation: string;
  avatar: string;
  quote: string;
  date: string;
  featured_image: string;
  keywords: string[];
  meta_description: string;
  content: string;
  category?: string;
}

export function getAllStories(locale: 'en' | 'es' = 'en'): Story[] {
  const storiesDirectory = path.join(contentDirectory, locale);

  // Ensure directory exists
  if (!fs.existsSync(storiesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(storiesDirectory);
  const allStoriesData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(storiesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || '',
        name: data.name || '',
        age: data.age || 0,
        country: data.country || '',
        occupation: data.occupation || '',
        avatar: data.avatar || '',
        quote: data.quote || '',
        date: data.date || '',
        featured_image: data.featured_image || '',
        keywords: data.keywords || [],
        meta_description: data.meta_description || '',
        category: data.category || '',
        content,
      };
    });

  // Sort stories by date
  return allStoriesData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getStoryBySlug(slug: string, locale: 'en' | 'es' = 'en'): Story | null {
  try {
    const storiesDirectory = path.join(contentDirectory, locale);
    const fullPath = path.join(storiesDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      name: data.name || '',
      age: data.age || 0,
      country: data.country || '',
      occupation: data.occupation || '',
      avatar: data.avatar || '',
      quote: data.quote || '',
      date: data.date || '',
      featured_image: data.featured_image || '',
      keywords: data.keywords || [],
      meta_description: data.meta_description || '',
      category: data.category || '',
      content,
    };
  } catch (error) {
    return null;
  }
}

export function getAllStorySlugs(locale: 'en' | 'es' = 'en'): string[] {
  const storiesDirectory = path.join(contentDirectory, locale);

  if (!fs.existsSync(storiesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(storiesDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));
}
