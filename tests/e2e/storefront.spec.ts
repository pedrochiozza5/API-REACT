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

const variantProduct = {
  ...product, id: 91, slug: 'mate-variantes', name: 'Mate con variantes',
  hasVariants: true,
  imageUrl:'/brand/bien-amargos-mark.png',
  images:[{imageUrl:'/brand/varios.webp'}],
  variants:[
    {id: 111, name:'Color', value:'Negro', colorHex:'#202020', sku:'MAT-NEG', price:30000,
     trackStock:true,stockQty:10,active:true,sortOrder:1,
     imageUrl:'/brand/repisa.webp',images:[{imageUrl:'/brand/chicos.webp'}]},
    {id: 112, name:'Color', value:'Marrón', colorHex:'#6b391c', sku:'MAT-MAR', price:32000,
     trackStock:true,stockQty:5,active:true,sortOrder:2,
     imageUrl:'/brand/yerbas-stock.webp',images:[{imageUrl:'/brand/hero-beach.webp'}]},
  ],
};


const singleImageProduct = {
  ...product, id: 201, slug: 'mate-unico', name: 'Mate única foto',
  imageUrl: '/brand/repisa.webp', images: [],
};

const manyImageProduct = {
  ...product, id: 202, slug: 'mate-galeria', name: 'Mate diez fotos',
  imageUrl: '/brand/repisa.webp?photo=1',
  images: Array.from({length: 9}, (_, i) => ({imageUrl: `/brand/repisa.webp?photo=${i + 2}`})),
};

async function assertImageIsVisible(page: import('@playwright/test').Page, expected: string) {
  const mainImage=page.locator('[aria-label^="Galería de"] .v11-product-stage__slide').first().locator('img').first();
  await expect(mainImage).toHaveAttribute('src',expected);
  await expect.poll(async()=>mainImage.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  await expect.poll(async()=>mainImage.evaluate((img:HTMLImageElement)=>Number.parseFloat(getComputedStyle(img).opacity))).toBeGreaterThan(.9);
}

test.beforeEach(async ({ page }) => {
  // Mock the API: no production database, no real customer/orders/stock changes.
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    let data: unknown = [];
    if (pathname === '/api/store-settings') data = { settings: {}, brands: [] };
    else if (pathname === '/api/products/mate-de-prueba') data = product;
    else if (pathname === '/api/products/mate-variantes') data = variantProduct;
    else if (pathname === '/api/products/mate-unico') data = singleImageProduct;
    else if (pathname === '/api/products/mate-galeria') data = manyImageProduct;
    else if (pathname === '/api/products') data = [product,variantProduct];
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
  await expect(carousel.getByRole('button', { name: 'Banner siguiente' })).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
});

test('mobile product preserves images and confirms add-to-cart without checkout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/producto/mate-de-prueba');
  await expect(page.getByRole('heading', { name: 'Mate de prueba' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver imagen 2 de 3' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imagen siguiente' })).toHaveCount(0);
  await page.getByRole('button', { name: /^Agregar/ }).click();
  await expect(page.getByText('Agregado a tu ronda')).toBeVisible();
  await page.screenshot({ path: 'test-results/product-mobile.png', fullPage: true });
});

test('switching variants after changing images never hides a valid product image', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/producto/mate-variantes');
  await page.getByRole('button',{name:'Negro',exact:false}).click();
  await assertImageIsVisible(page,'/brand/repisa.webp');
  await page.getByRole('button',{name:'Ver imagen 2 de 2'}).click();
  await page.getByRole('button',{name:'Marrón',exact:false}).click();
  await assertImageIsVisible(page,'/brand/yerbas-stock.webp');
  await page.getByRole('button',{name:'Negro',exact:false}).click();
  await assertImageIsVisible(page,'/brand/repisa.webp');
  // This is the formerly broken cached-image transition.
  await page.getByRole('button',{name:'Marrón',exact:false}).click();
  await assertImageIsVisible(page,'/brand/yerbas-stock.webp');
});

test('product card changes preview variants without retaining a stale media index', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/catalogo?brand=amargos');
  const card=page.locator('article.product-card-v5').filter({hasText:'Mate con variantes'});
  await expect(card).toBeVisible();
  await expect(card.getByRole('button',{name:'Imagen siguiente'})).toHaveCount(0);
  await card.hover();
  await card.getByRole('button',{name:'Vista Marrón'}).click();
  const image=card.locator('[data-image-url]').first();
  await expect(image).toHaveAttribute('src','/brand/yerbas-stock.webp');
  await expect.poll(async()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0&&getComputedStyle(img).opacity!=='0')).toBeTruthy();
  await card.getByRole('button',{name:'Vista Negro'}).click();
  await expect(image).toHaveAttribute('src','/brand/repisa.webp');
});


test('gallery thumbnails replace arrows and remain usable with keyboard', async ({page}) => {
  await page.setViewportSize({width:1280,height:900});
  await page.goto('/producto/mate-de-prueba');
  const gallery=page.getByRole('region',{name:'Galería de Mate de prueba'});
  await expect(gallery.getByRole('button',{name:'Imagen anterior'})).toHaveCount(0);
  await expect(gallery.getByRole('button',{name:'Imagen siguiente'})).toHaveCount(0);
  await gallery.getByRole('button',{name:'Ver imagen 3 de 3'}).click();
  await expect(gallery.getByRole('button',{name:'Ver imagen 3 de 3'})).toHaveAttribute('aria-current','true');
  await gallery.focus();
  await gallery.press('ArrowLeft');
  await expect(gallery.getByRole('button',{name:'Ver imagen 2 de 3'})).toHaveAttribute('aria-current','true');
});

test('lightbox uses accessible dialog and restores focus when closed', async ({page}) => {
  await page.goto('/producto/mate-de-prueba');
  const expand=page.getByRole('button',{name:'Ampliar imagen'});
  await expand.click();
  await expect(page.getByRole('dialog',{name:/Imagen ampliada|Mate de prueba/})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(expand).toBeFocused();
});

test('catalog product card navigates on tap without media arrows', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/catalogo?brand=amargos');
  const card=page.locator('article.product-card-v5').filter({hasText:'Mate de prueba'});
  await expect(card.getByRole('button',{name:'Imagen siguiente'})).toHaveCount(0);
  await expect(card.getByRole('button',{name:'Imagen anterior'})).toHaveCount(0);
  await card.getByRole('link',{name:'Ver Mate de prueba'}).click();
  await expect(page).toHaveURL(/\/producto\/mate-de-prueba/);
});


test('single photograph has no redundant thumbnail navigation', async ({page}) => {
  await page.goto('/producto/mate-unico');
  await expect(page.getByRole('heading',{name:'Mate única foto'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Miniaturas de producto'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Imagen siguiente'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Ampliar imagen'})).toBeVisible();
});

test('ten-image gallery provides direct thumbnail access without navigation arrows', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/producto/mate-galeria');
  const group=page.getByRole('group',{name:'Miniaturas de producto'});
  await expect(group.getByRole('button')).toHaveCount(10);
  await group.getByRole('button',{name:'Ver imagen 10 de 10'}).click();
  await expect(group.getByRole('button',{name:'Ver imagen 10 de 10'})).toHaveAttribute('aria-current','true');
  await expect(page.getByRole('button',{name:'Imagen siguiente'})).toHaveCount(0);
  const overflows=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflows).toBeLessThanOrEqual(2);
});

test('desktop card fetches its second image only on hover, never on mobile tap',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/catalogo?brand=amargos');
  const card=page.locator('article.product-card-v5').filter({hasText:'Mate de prueba'});
  const photoLink=card.getByRole('link',{name:'Ver Mate de prueba'});
  await expect(photoLink.locator('img')).toHaveCount(1);
  await card.hover();
  await expect(photoLink.locator('img')).toHaveCount(2);
  await expect.poll(async()=>{
    return photoLink.locator('img').last().evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0&&Number.parseFloat(getComputedStyle(img).opacity)>0.9);
  }).toBeTruthy();
});
