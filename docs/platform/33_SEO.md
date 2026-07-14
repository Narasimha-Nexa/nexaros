# SEO

## Marketing Website

### Meta Tags

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: 'NexaROS - Restaurant Operating System',
  description: 'Complete restaurant management platform',
  openGraph: {
    title: 'NexaROS',
    description: 'Complete restaurant management platform',
    images: ['/og-image.png'],
  },
};
```

### Sitemap

```typescript
// app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://nexaros.com', lastModified: new Date() },
    { url: 'https://nexaros.com/about', lastModified: new Date() },
    { url: 'https://nexaros.com/pricing', lastModified: new Date() },
    // ... all routes
  ];
}
```

### Robots.txt

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
  };
}
```

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "NexaROS",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Android, iOS"
}
```

## Flutter App

### App Store Optimization

- Keyword-rich title
- Compelling description
- Screenshots
- App preview video

## Performance

- Fast load times
- Mobile-friendly
- HTTPS
- Clean URLs

## Related Documents

- [Marketing Website](33_MARKETING_WEBSITE.md)
- [Performance](30_PERFORMANCE.md)
