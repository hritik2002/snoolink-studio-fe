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
      '/app/search': 0.9,
      '/app/collections': 0.8,
      '/app/uploads': 0.7,
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: customPriorities[path] || config.priority,
      lastmod: new Date().toISOString(),
    }
  },
}
