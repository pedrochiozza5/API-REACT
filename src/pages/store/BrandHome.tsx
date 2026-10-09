import { useQuery } from '@tanstack/react-query';
import type { BrandId, Product } from '@/lib/types';
import { apiGet } from '@/lib/api';
import { Header } from '@/components/storefront/Header';
import { Hero } from '@/components/storefront/Hero';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';
import { FeaturedCarousel } from '@/components/storefront/FeaturedCarousel';
import { EditorialFeature } from '@/components/storefront/EditorialFeature';
import { Footer } from '@/components/storefront/Footer';
import { StoreBackdrop } from '@/components/storefront/StoreBackdrop';
import { EditorialBannerCarousel } from '@/components/storefront/EditorialBannerCarousel';

type Category = { id: number; brandId: BrandId; name: string; slug: string; imageUrl?:string|null; iconKey?:string|null };

export function BrandHome({ brand }: { brand: BrandId }) {
  const featured = useQuery({ queryKey: ['featured-products', brand], queryFn: () => apiGet<Product[]>(`/api/products?brand=${brand}&featured=1&limit=10`) });
  const categories = useQuery({ queryKey: ['categories', brand], queryFn: () => apiGet<Category[]>(`/api/categories?brand=${brand}`) });

  return <main className={`storefront-page ${brand === 'enyerbados' ? 'storefront-page--yellow' : 'storefront-page--green'}`}>
    <StoreBackdrop brand={brand} />
    <div className="storefront-content">
      <Header brand={brand} />
      <Hero brand={brand} />
      <EditorialBannerCarousel brand={brand} />
      <div className="home-clean-flow">
        <FeaturedCarousel brand={brand} products={featured.data || []} loading={featured.isLoading} />
        <CategoryShowcase brand={brand} categories={categories.data || []} />
        <EditorialFeature brand={brand} />
      </div>
      <Footer brand={brand} />
    </div>
  </main>;
}
