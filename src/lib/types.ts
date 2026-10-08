export type BrandId = 'amargos' | 'enyerbados';

export interface ProductImage {
  id?: number;
  imageUrl: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface ProductVariant {
  id: number;
  productId?: number;
  name: string;
  value: string;
  colorHex?: string | null;
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  wholesalePrice?: number | null;
  stockQty: number;
  lowStockThreshold: number;
  trackStock: boolean | number;
  imageUrl?: string | null;
  active: boolean | number;
  sortOrder?: number;
  images?: ProductImage[];
  imageZoom?: number | null;
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  imageBlendMode?: 'normal' | 'multiply' | string | null;
}

export interface Product {
  id: number;
  brandId: BrandId;
  categoryId?: number | null;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  wholesaleEnabled?: boolean | number;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  stockQty: number;
  lowStockThreshold: number;
  trackStock: boolean | number;
  featured: boolean | number;
  collectionFeatured?: boolean | number;
  sortOrder?: number;
  active?: boolean | number;
  imageUrl?: string | null;
  imageZoom?: number | null;
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  imageBlendMode?: 'normal' | 'multiply' | string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  variantCount?: number;
  hasVariants?: boolean;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface CartItem {
  key: string;
  productId: number;
  variantId?: number | null;
  brandId: BrandId;
  name: string;
  slug: string;
  sku: string;
  price: number;
  qty: number;
  stockQty: number;
  trackStock: boolean;
  imageUrl?: string | null;
  variantName?: string | null;
  variantValue?: string | null;
  variantSku?: string | null;
  colorHex?: string | null;
  imageZoom?: number | null;
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  imageBlendMode?: 'normal' | 'multiply' | string | null;
}

export interface OrderItemAdmin {
  orderId: number;
  brandId: BrandId;
  productName: string;
  sku: string;
  variantName?: string | null;
  variantValue?: string | null;
  variantSku?: string | null;
  imageUrl?: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface OrderAdmin {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  deliveryType: 'shipping' | 'pickup';
  address?: string | null;
  notes?: string | null;
  internalNote?: string | null;
  total: number;
  orderTotal?: number;
  status: string;
  reservedUntil?: string | null;
  createdAt: string;
  updatedAt?: string;
  mixedBrands?: boolean;
  canOperate?: boolean;
  events?: { fromStatus?: string | null; toStatus: string; note?: string | null; createdAt: string }[];
  items: OrderItemAdmin[];
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  keywords?: string | null;
  category: string;
  sortOrder: number;
  active: boolean | number;
}

export interface MateroLocation {
  id:number;
  name:string;
  city?:string|null;
  province?:string|null;
  country?:string|null;
  latitude:number;
  longitude:number;
  description?:string|null;
  imageUrl?:string|null;
  brandId?:BrandId|null;
  source?:string;
  sourceExternalId?:string|null;
  featured?:boolean|number;
  active?:boolean|number;
  sortOrder?:number;
  createdAt?:string;
  updatedAt?:string;
}
export interface MaterosPayload { locations:MateroLocation[]; stats:{locations:number;cities:number;provinces:number;countries:number}; }
