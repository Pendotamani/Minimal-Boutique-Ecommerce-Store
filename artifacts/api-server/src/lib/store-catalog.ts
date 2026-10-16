export const storeCatalog = {
  "jacket-black-bsr": { name: "Black BSR Jacket", unitPrice: 499 },
  "jacket-white-spsr": { name: "White SPSR Jacket", unitPrice: 499 },
  "tshirt-super": { name: "Super Graphic Tee", unitPrice: 499 },
  "tshirt-la": { name: "LA Graphic Tee", unitPrice: 499 },
  "jacket-blue-bsr": { name: "Blue BSR Jacket", unitPrice: 499 },
  "tshirt-batman-logo": { name: "Batman Logo Tee", unitPrice: 499 },
  "tshirt-batman-knight": { name: "Batman Knight Tee", unitPrice: 499 },
  "jacket-grey-uspa": { name: "Grey USPA Jacket", unitPrice: 499 },
  "tshirt-la-california": { name: "LA California Tee", unitPrice: 499 },
  "tshirt-tribal": { name: "Tribal Graphic Tee", unitPrice: 499 },
  "pants-bonkers": { name: "Bonkers Relaxed Pants", unitPrice: 499 },
} as const;

export type StoreProductId = keyof typeof storeCatalog;

export function getShipping(total: number) {
  return total >= 3000 ? 0 : 99;
}
