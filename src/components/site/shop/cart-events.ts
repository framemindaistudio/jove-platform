/** Tiny event bus so any "Add to cart" button can trigger the shared toast without extra context. */
export const CART_ADDED_EVENT = "jove:cart-added";

export interface CartAddedDetail {
  slug: string;
  name: string;
  image?: string;
  qty: number;
}

export function announceCartAdd(detail: CartAddedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, { detail }));
}
