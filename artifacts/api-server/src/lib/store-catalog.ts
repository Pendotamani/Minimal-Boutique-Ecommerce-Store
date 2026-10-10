export const storeCatalog = {
  "jacket-black-bsr": { name: "Black BSR Jacket", unitPrice: 2499 },
  "jacket-white-spsr": { name: "White SPSR Jacket", unitPrice: 2499 },
  "tshirt-super": { name: "Super Graphic Tee", unitPrice: 999 },
  "tshirt-la": { name: "LA Graphic Tee", unitPrice: 999 },
  "jacket-blue-bsr": { name: "Blue BSR Jacket", unitPrice: 2499 },
  "tshirt-batman-logo": { name: "Batman Logo Tee", unitPrice: 1099 },
  "tshirt-batman-knight": { name: "Batman Knight Tee", unitPrice: 1199 },
  "jacket-grey-uspa": { name: "Grey USPA Jacket", unitPrice: 2499 },
  "tshirt-la-california": { name: "LA California Tee", unitPrice: 1099 },
  "tshirt-tribal": { name: "Tribal Graphic Tee", unitPrice: 1099 },
  "pants-bonkers": { name: "Bonkers Relaxed Pants", unitPrice: 1599 },
} as const;

export type StoreProductId = keyof typeof storeCatalog;

export function getShipping(total: number) {
  return total >= 3000 ? 0 : 99;
}
