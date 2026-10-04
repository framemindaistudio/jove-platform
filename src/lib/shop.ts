/** Shop rules shared by the cart UI and the order API. */
export const SHIPPING_FLAT = 99;
export const FREE_SHIPPING_ABOVE = 2499;
export const CART_STORAGE_KEY = "jove-cart-v1";

/** Dispatch promises — one place, so the store, cart and policies never disagree. */
export const DISPATCH_IN_STOCK = "2–4 working days";
export const DISPATCH_MADE_TO_ORDER = "5–7 working days";

/** A product with no counted stock is assembled after the order is placed. */
export function isMadeToOrder(stock: number | undefined | null) {
  return !(typeof stock === "number" && stock > 0);
}

export function dispatchWindow(stock: number | undefined | null) {
  return isMadeToOrder(stock) ? DISPATCH_MADE_TO_ORDER : DISPATCH_IN_STOCK;
}

export function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_ABOVE || subtotal === 0 ? 0 : SHIPPING_FLAT;
}
