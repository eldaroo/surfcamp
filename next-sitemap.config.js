// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://santateresasurfcamp.com", // tu dominio
  generateRobotsTxt: true,                   // genera robots.txt
  sitemapSize: 7000,
  exclude: [
    '/api/*',     // rutas internas
    '/admin/*',   // si tenés panel
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
};
