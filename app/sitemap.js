import { allPosts } from "@/lib/getAllPosts"; 
// Ajustá esta línea según dónde tengas tu función que carga los posts

export default async function sitemap() {
  const baseUrl = "https://santateresasurfcamp.com";

  // Generar URLs del blog (EN / ES)
  const blogRoutes = allPosts.map((post) => [
    {
      url: `${baseUrl}/en/blog/${post.slug}`,
      lastModified: new Date(post.date),
      alternates: {
        languages: {
          en: `${baseUrl}/en/blog/${post.slug}`,
          es: `${baseUrl}/es/blog/${post.slug}`,
        },
      },
    },
    {
      url: `${baseUrl}/es/blog/${post.slug}`,
      lastModified: new Date(post.date),
      alternates: {
        languages: {
          en: `${baseUrl}/en/blog/${post.slug}`,
          es: `${baseUrl}/es/blog/${post.slug}`,
        },
      },
    },
  ]).flat();

  // Rutas estáticas principales (home, surf, etc)
  const staticRoutes = [
    "",
    "/surf-programs",
    "/blog",
  ].map((route) => [
    {
      url: `${baseUrl}/en${route}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          en: `${baseUrl}/en${route}`,
          es: `${baseUrl}/es${route}`,
        },
      },
    },
    {
      url: `${baseUrl}/es${route}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          en: `${baseUrl}/en${route}`,
          es: `${baseUrl}/es${route}`,
        },
      },
    },
  ]).flat();

  return [...staticRoutes, ...blogRoutes];
}
