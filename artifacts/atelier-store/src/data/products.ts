export type StoreCategory = 'men' | 'women' | 'kids' | 'shoes';

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

const sizes = ['S', 'M', 'L', 'XL'];
const image = (file: string, altText: string): ProductImage => ({
  url: `${import.meta.env.BASE_URL}assets/products/${file}`,
  altText,
});

function makeProduct({
  handle,
  title,
  description,
  type,
  price,
  color,
  files,
  tags,
}: {
  handle: string;
  title: string;
  description: string;
  type: string;
  price: number;
  color: string;
  files: { file: string; alt: string }[];
  tags: string[];
}): StoreProduct {
  return {
    id: handle,
    handle,
    title,
    description,
    productType: `Men · ${type}`,
    category: 'men',
    tags,
    images: files.map(({ file, alt }) => image(file, alt)),
    options: [{ name: 'Size', values: sizes }, { name: 'Color', values: [color] }],
    variants: sizes.map((size) => ({
      id: `${handle}-${size.toLowerCase()}`,
      title: `${color} / ${size}`,
      availableForSale: true,
      price: String(price),
      currencyCode: 'INR',
      selectedOptions: [{ name: 'Size', value: size }, { name: 'Color', value: color }],
    })),
  };
}

export const products: StoreProduct[] = [
  makeProduct({
    handle: 'jacket-black-bsr',
    title: 'Black BSR Jacket',
    description: 'A lightweight zip jacket in deep black, finished with a neat stand collar and understated chest crest.',
    type: 'Jackets',
    price: 2499,
    color: 'Black',
    files: [{ file: 'jacket-black-bsr.jpg', alt: 'Black BSR zip jacket on a neutral backdrop' }],
    tags: ['jacket', 'zip-up', 'black'],
  }),
  makeProduct({
    handle: 'jacket-white-spsr',
    title: 'White SPSR Jacket',
    description: 'A clean white zip jacket with a relaxed everyday fit and a minimal crest detail.',
    type: 'Jackets',
    price: 2499,
    color: 'White',
    files: [{ file: 'jacket-white-spsr.jpg', alt: 'White SPSR zip jacket on a neutral backdrop' }],
    tags: ['jacket', 'zip-up', 'white'],
  }),
  makeProduct({
    handle: 'tshirt-super',
    title: 'Super Graphic Tee',
    description: 'A charcoal washed tee with a simple bold graphic and an easy, everyday shape.',
    type: 'T-shirts',
    price: 999,
    color: 'Charcoal',
    files: [{ file: 'tshirt-super.jpg', alt: 'Charcoal washed t-shirt with a Super graphic' }],
    tags: ['t-shirt', 'graphic', 'charcoal'],
  }),
  makeProduct({
    handle: 'tshirt-la',
    title: 'LA Graphic Tee',
    description: 'A soft, dark graphic tee with an easy fit and a laid-back Los Angeles feel.',
    type: 'T-shirts',
    price: 999,
    color: 'Charcoal',
    files: [
      { file: 'tshirt-la.jpg', alt: 'Front of a dark Los Angeles graphic tee' },
      { file: 'tshirt-la-california.jpg', alt: 'Back of a dark California graphic tee' },
    ],
    tags: ['t-shirt', 'graphic', 'la'],
  }),
  makeProduct({
    handle: 'jacket-blue-bsr',
    title: 'Blue BSR Jacket',
    description: 'A bright sky-blue layer with a practical zip front, neat collar, and easy everyday fit.',
    type: 'Jackets',
    price: 2499,
    color: 'Blue',
    files: [{ file: 'jacket-blue-bsr.jpg', alt: 'Sky-blue BSR zip jacket on a neutral backdrop' }],
    tags: ['jacket', 'zip-up', 'blue'],
  }),
  makeProduct({
    handle: 'tshirt-batman-logo',
    title: 'Batman Logo Tee',
    description: 'A black cotton-look tee with a clean bat emblem and understated graphic sleeves.',
    type: 'T-shirts',
    price: 1099,
    color: 'Black',
    files: [{ file: 'tshirt-batman-logo.jpg', alt: 'Black t-shirt with a white bat logo' }],
    tags: ['t-shirt', 'graphic', 'batman'],
  }),
  makeProduct({
    handle: 'tshirt-batman-knight',
    title: 'Batman Knight Tee',
    description: 'A statement graphic tee with an illustrated front and an all-over dark print.',
    type: 'T-shirts',
    price: 1199,
    color: 'Black',
    files: [{ file: 'tshirt-batman-knight.jpg', alt: 'Black t-shirt with a Batman Knight illustration' }],
    tags: ['t-shirt', 'graphic', 'batman'],
  }),
  makeProduct({
    handle: 'jacket-grey-uspa',
    title: 'Grey USPA Jacket',
    description: 'A pale grey zip jacket with a clean, versatile shape for everyday layering.',
    type: 'Jackets',
    price: 2499,
    color: 'Grey',
    files: [{ file: 'jacket-grey-uspa.jpg', alt: 'Pale grey USPA zip jacket on a neutral backdrop' }],
    tags: ['jacket', 'zip-up', 'grey'],
  }),
  makeProduct({
    handle: 'tshirt-la-california',
    title: 'LA California Tee',
    description: 'A dark, washed graphic tee with bold California-inspired lettering and an easy fit.',
    type: 'T-shirts',
    price: 1099,
    color: 'Charcoal',
    files: [
      { file: 'tshirt-la-california.jpg', alt: 'Back of a dark California graphic tee' },
      { file: 'tshirt-la.jpg', alt: 'Front of a dark Los Angeles graphic tee' },
    ],
    tags: ['t-shirt', 'graphic', 'california'],
  }),
  makeProduct({
    handle: 'tshirt-tribal',
    title: 'Tribal Graphic Tee',
    description: 'A charcoal washed tee with a detailed tribal-inspired back graphic.',
    type: 'T-shirts',
    price: 1099,
    color: 'Charcoal',
    files: [{ file: 'tshirt-tribal.jpg', alt: 'Back of a charcoal t-shirt with a light tribal graphic' }],
    tags: ['t-shirt', 'graphic', 'tribal'],
  }),
  makeProduct({
    handle: 'pants-bonkers',
    title: 'Bonkers Relaxed Pants',
    description: 'A relaxed everyday trouser silhouette with an easy straight leg and a clean finish.',
    type: 'Trousers',
    price: 1599,
    color: 'Black',
    files: [{ file: 'pants-bonkers.jpg', alt: 'Illustrated placeholder for black relaxed-fit trousers' }],
    tags: ['pants', 'trousers', 'relaxed fit'],
  }),
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
