import { test, expect } from '@playwright/test';

const product = {
  id: 1, brandId: 'amargos', categoryId: 1, categoryName: 'Mates',
  name: 'Mate de prueba', slug: 'mate-de-prueba', sku: 'BA-MAT-001',
  price: 30000, compareAtPrice: 40000, trackStock: true, stockQty: 8,
  lowStockThreshold: 2, featured: true, active: true, variants: [],
  hasVariants: false, shortDescription: 'Un mate para todas las rondas.',
  description: 'Producto usado únicamente en el navegador de prueba.',
  imageUrl: '/brand/repisa.webp',
  images: [{ imageUrl: '/brand/hero-beach.webp' }, { imageUrl: '/brand/chicos.webp' }],
};

test.beforeEach(async ({ page }) => {
  // Mock the API: no production database, no real customer/orders/stock changes.
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    let data: unknown = [];
    if (pathname === '/api/store-settings') data = { settings: {}, brands: [] };
    else if (pathname === '/api/products/mate-de-prueba') data = product;
    else if (pathname === '/api/products') data = [product];
    else if (pathname === '/api/categories') data = [{ id: 1, brandId: 'amargos', name: 'Mates', slug: 'mates' }];
    else if (pathname === '/api/banners') data = [];
    else if (pathname === '/api/faqs') data = [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
});

test('desktop Home has one edge-to-edge hero carousel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Historias destacadas' });
  await expect(carousel).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu próxima ronda empieza acá.' })).toBeVisible();
  const bounds = await carousel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(bounds!.width - 1440)).toBeLessThanOrEqual(2);
  await expect(carousel.getByRole('button', { name: 'Banner siguiente' })).toBeVisible();
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
});

test('mobile Yerbados maintains an accessible, overflow-free carousel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/yerbados');
  const carousel = page.getByRole('region', { name: 'Historias destacadas' });
  await expect(carousel).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yerba con presencia.' })).toBeVisible();
  const button = carousel.getByRole('button', { name: 'Banner siguiente' });
  const bounds = await button.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
});

test('mobile product preserves images and confirms add-to-cart without checkout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/producto/mate-de-prueba');
  await expect(page.getByRole('heading', { name: 'Mate de prueba' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imagen siguiente' })).toBeVisible();
  await page.getByRole('button', { name: /^Agregar/ }).click();
  await expect(page.getByText('Agregado a tu ronda')).toBeVisible();
  await page.screenshot({ path: 'test-results/product-mobile.png', fullPage: true });
});
