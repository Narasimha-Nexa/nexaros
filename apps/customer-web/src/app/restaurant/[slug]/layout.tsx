import { RealtimeProvider } from '@/components/restaurant/RealtimeProvider';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function RestaurantLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  return (
    <RealtimeProvider slug={slug}>
      {children}
    </RealtimeProvider>
  );
}
