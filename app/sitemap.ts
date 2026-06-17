import { MetadataRoute } from "next"
import { APP_ROUTES } from "@/lib/app-nav"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://app.snoolink.com"
  const currentDate = new Date()

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}${APP_ROUTES.search}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}${APP_ROUTES.collections}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}${APP_ROUTES.uploads}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ]
}
