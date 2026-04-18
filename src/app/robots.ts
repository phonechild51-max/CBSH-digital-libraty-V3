import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cbsh-digital-library.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/sign-in', '/sign-up'],
      disallow: ['/admin/', '/teacher/', '/student/', '/api/', '/take-quiz/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
