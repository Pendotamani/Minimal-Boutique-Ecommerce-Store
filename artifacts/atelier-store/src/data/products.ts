export type StoreCategory = 'men' | 'women' | 'kids';

export type ProductOptionValue = {
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: string;
  currencyCode: 'INR';
  selectedOptions: ProductOptionValue[];
};

export type ProductImage = {
  url: string;
  altText: string;
};

export type StoreProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  category: StoreCategory;
  tags: string[];
  images: ProductImage[];
  options: { name: string; values: string[] }[];
  variants: ProductVariant[];
};

const image = (photoId: string, altText: string): ProductImage => ({
  url: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=960&q=82`,
  altText,
});

function sizes(prefix: string, price: number, values: string[], colors: string[]): ProductVariant[] {
  return values.flatMap((size, sizeIndex) => colors.map((color, colorIndex) => ({
    id: `${prefix}-size-${sizeIndex + 1}-color-${colorIndex + 1}`,
    title: `${color} / ${size}`,
    availableForSale: true,
    price: String(price),
    currencyCode: 'INR',
    selectedOptions: [{ name: 'Size', value: size }, { name: 'Color', value: color }],
  })));
}

export const products: StoreProduct[] = [
  {
    id: 'preview-mens-overshirt',
    handle: 'everyday-cotton-overshirt',
    title: 'Everyday Cotton Overshirt',
    description: 'A soft, easy layer in breathable cotton. Designed with a relaxed shape that works open over a tee or buttoned up on its own.',
    productType: 'Men · Shirts',
    category: 'men',
    tags: ['cotton', 'layering'],
    images: [
      image('photo-1598033129183-c4f50c736f10', 'A neutral cotton overshirt'),
      image('photo-1591047139829-d91aecb6caea', 'A close view of a casual outer layer'),
    ],
    options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Oat', 'Charcoal'] }],
    variants: sizes('mens-overshirt', 2490, ['S', 'M', 'L', 'XL'], ['Oat', 'Charcoal']),
  },
  {
    id: 'preview-mens-tee',
    handle: 'soft-cotton-tee',
    title: 'Soft Cotton Tee',
    description: 'An everyday tee in soft-touch cotton with an easy fit and a clean neckline. Made for repeat wear.',
    productType: 'Men · Tees',
    category: 'men',
    tags: ['cotton', 'everyday'],
    images: [
      image('photo-1583743814966-8936f37f4678', 'A relaxed cotton t-shirt'),
      image('photo-1521572163474-6864f9cf17ab', 'A folded white cotton t-shirt'),
    ],
    options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Natural', 'Sage'] }],
    variants: sizes('mens-tee', 990, ['S', 'M', 'L', 'XL'], ['Natural', 'Sage']),
  },
  {
    id: 'preview-womens-shirt',
    handle: 'relaxed-linen-shirt',
    title: 'Relaxed Linen Shirt',
    description: 'Light, breathable linen with a gently relaxed fit. An uncomplicated layer for warm afternoons and slower mornings.',
    productType: 'Women · Shirts',
    category: 'women',
    tags: ['linen', 'light layers'],
    images: [
      image('photo-1598554747436-c9293d6a588f', 'A softly draped linen shirt'),
      image('photo-1503341504253-dff4815485f1', 'A light neutral summer outfit'),
    ],
    options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L'] }, { name: 'Color', values: ['Ivory', 'Clay'] }],
    variants: sizes('womens-shirt', 2190, ['XS', 'S', 'M', 'L'], ['Ivory', 'Clay']),
  },
  {
    id: 'preview-womens-trousers',
    handle: 'everyday-wide-leg-trousers',
    title: 'Everyday Wide-leg Trousers',
    description: 'A fluid, easy-to-style trouser with a soft waistband and full-length shape. Comfortable enough to wear all day.',
    productType: 'Women · Trousers',
    category: 'women',
    tags: ['easy fit', 'everyday'],
    images: [
      image('photo-1594633312681-425c7b97ccd1', 'Relaxed wide-leg trousers'),
      image('photo-1483985988355-763728e1935b', 'A neutral everyday wardrobe'),
    ],
    options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L'] }, { name: 'Color', values: ['Sand', 'Olive'] }],
    variants: sizes('womens-trousers', 1890, ['XS', 'S', 'M', 'L'], ['Sand', 'Olive']),
  },
  {
    id: 'preview-kids-sweatshirt',
    handle: 'little-everyday-sweatshirt',
    title: 'Little Everyday Sweatshirt',
    description: 'A soft cotton-blend layer with an easy shape for school mornings, park afternoons, and everywhere in between.',
    productType: 'Kids · Layers',
    category: 'kids',
    tags: ['soft cotton', 'layers'],
    images: [
      image('photo-1519238263530-99bdd11df2ea', 'A child wearing a casual sweatshirt'),
      image('photo-1503919005314-30d93d07d823', 'A small everyday clothing outfit'),
    ],
    options: [{ name: 'Size', values: ['2–3Y', '4–5Y', '6–7Y'] }, { name: 'Color', values: ['Oat', 'Rust'] }],
    variants: sizes('kids-sweatshirt', 1290, ['2–3Y', '4–5Y', '6–7Y'], ['Oat', 'Rust']),
  },
  {
    id: 'preview-kids-tee',
    handle: 'little-cotton-tee',
    title: 'Little Cotton Tee',
    description: 'A gentle, breathable tee with a comfortable everyday fit. Easy to layer, easy to love, easy to wash.',
    productType: 'Kids · Tees',
    category: 'kids',
    tags: ['cotton', 'everyday'],
    images: [
      image('photo-1597892657493-6847b9640bac', 'A child in an everyday cotton tee'),
      image('photo-1519238263530-99bdd11df2ea', 'A playful kidswear look'),
    ],
    options: [{ name: 'Size', values: ['2–3Y', '4–5Y', '6–7Y'] }, { name: 'Color', values: ['Ecru', 'Blue'] }],
    variants: sizes('kids-tee', 790, ['2–3Y', '4–5Y', '6–7Y'], ['Ecru', 'Blue']),
  },
];

export function getProduct(handle: string) {
  return products.find((product) => product.handle === handle);
}

export function getProducts(options: {
  category?: StoreCategory;
  search?: string;
  limit?: number;
} = {}) {
  const normalizedSearch = options.search?.trim().toLocaleLowerCase();
  return products
    .filter((product) => !options.category || product.category === options.category)
    .filter((product) => !normalizedSearch || [
      product.title,
      product.productType,
      product.description,
      ...product.tags,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)))
    .slice(0, options.limit ?? products.length);
}
