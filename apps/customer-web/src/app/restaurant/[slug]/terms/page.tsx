import type { Metadata } from 'next';
import { PolicyPage } from '@/components/restaurant/PolicyPage';
import { fetchRestaurantSite } from '@/lib/restaurant-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchRestaurantSite(slug);
  const name = data?.website?.restaurantName || data?.tenant?.name || 'Restaurant';
  return {
    title: { absolute: `Terms of Service | ${name}` },
    description: `Terms of Service for ${name}.`,
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PolicyPage slug={slug} policyKey="termsOfService" fallbackTitle="Terms of Service" />;
}
