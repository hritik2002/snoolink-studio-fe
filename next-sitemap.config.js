/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://app.snoolink.com',
  generateRobotsTxt: false, // We have a custom robots.txt
  generateIndexSitemap: false,
  exclude: ['/api/*', '/auth/*'],
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  transform: async (config, path) => {
    // Custom priority for specific pages
    const customPriorities = {
      '/': 1.0,
      '/login': 0.8,
      '/?view=search': 0.9,
      '/?view=collections': 0.8,
      '/?view=uploads': 0.7,
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: customPriorities[path] || config.priority,
      lastmod: new Date().toISOString(),
    }
  },
}
