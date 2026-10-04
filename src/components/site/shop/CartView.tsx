"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  FlaskConical,
  Loader2,
  Lock,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  RotateCcw,
  ShoppingBag,
  Trash2,
  Truck,
  Undo2,
} from "lucide-react";
import { CornerMarks, GridBackdrop, SectionLabel } from "@/components/brand/Blueprint";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { useCart, type CartLine } from "@/components/site/CartProvider";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT, shippingFor } from "@/lib/shop";
import { throwawayId, track } from "@/lib/analytics";
import { whatsappLink } from "@/lib/site";
import type { KitId } from "@/lib/content/business";
import type { LabMeta } from "@/lib/content/labs";
import { cn, formatINR } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";
import { QtyStepper } from "./QtyStepper";
import { labsFor, splitGrades, type ShopProduct } from "./catalog";

/* ──────────────────────────────────────────────────────────────────────────
 * Types & validation
 * ────────────────────────────────────────────────────────────────────────── */

type FormKey = "customerName" | "phone" | "email" | "address" | "city" | "pincode" | "notes";
type FormState = Record<FormKey, string> & { website: string };
type Errors = Partial<Record<FormKey, string>>;

const EMPTY_FORM: FormState = { customerName: "", phone: "", email: "", address: "", city: "", pincode: "", notes: "", website: "" };
const FIELD_ORDER: FormKey[] = ["customerName", "phone", "email", "address", "city", "pincode", "notes"];

interface PricedLine extends CartLine {
  available: boolean;
  grades?: string;
  kitId?: KitId;
}

interface PlacedOrder {
  number: string;
  total: number;
  subtotal: number;
  shipping: number;
  paymentLink: string | null;
  firstName: string;
  items: PricedLine[];
}

interface OrderResponse {
  ok?: boolean;
  number?: string;
  total?: number;
  paymentLink?: string | null;
  error?: string;
}

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (f.customerName.trim().length < 2) e.customerName = "Please enter your full name.";
  const phone = f.phone.trim();
  const digits = phone.replace(/\D/g, "");
  if (!phone) e.phone = "We need a phone number to confirm your order.";
  else if (!/^[+\d][\d\s-]{7,15}$/.test(phone) || digits.length < 10 || digits.length > 13) e.phone = "Enter a valid 10-digit mobile number (with +91 if you like).";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "That email doesn’t look right — or leave it blank.";
  if (f.address.trim().length < 10) e.address = "Please add your full address — house/flat, street, area and state.";
  if (!f.city.trim()) e.city = "Please enter your city or town.";
  if (!/^[1-9]\d{5}$/.test(f.pincode.trim())) e.pincode = "Enter your 6-digit PIN code.";
  return e;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Cart + checkout
 * ────────────────────────────────────────────────────────────────────────── */

/** Cart lines, delivery form and order placement. The catalog (from the server) re-prices lines exactly like the order API. */
export function CartView({ catalog }: { catalog: ShopProduct[] }) {
  const { lines, ready, add, setQty, remove, clear } = useCart();
  const reduce = useReducedMotion();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [removed, setRemoved] = useState<CartLine | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const bySlug = useMemo(() => new Map(catalog.map((p) => [p.slug, p])), [catalog]);

  // Keep stored lines in sync with current catalog prices/names (add with qty 0 merges fields only).
  useEffect(() => {
    if (!ready) return;
    for (const l of lines) {
      const c = bySlug.get(l.slug);
      if (c && c.available && (c.price !== l.price || c.name !== l.name || c.image !== l.image)) {
        add({ slug: c.slug, name: c.name, price: c.price, image: c.image }, 0);
      }
    }
  }, [ready, lines, bySlug, add]);

  // Undo notice disappears after a few seconds.
  useEffect(() => {
    if (!removed) return;
    const t = setTimeout(() => setRemoved(null), 8000);
    return () => clearTimeout(t);
  }, [removed]);

  useEffect(() => {
    if (apiError) alertRef.current?.focus();
  }, [apiError]);

  const priced: PricedLine[] = useMemo(
    () =>
      lines.map((l) => {
        const c = bySlug.get(l.slug);
        return { ...l, price: c?.price ?? l.price, name: c?.name ?? l.name, image: c?.image ?? l.image, available: !!c && c.available, grades: c?.grades, kitId: c?.kitId };
      }),
    [lines, bySlug],
  );
  const orderable = priced.filter((l) => l.available);
  const count = orderable.reduce((s, l) => s + l.qty, 0);
  const subtotal = orderable.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  const onRemove = (l: CartLine) => {
    remove(l.slug);
    setRemoved(l);
  };
  const undo = () => {
    if (!removed) return;
    add({ slug: removed.slug, name: removed.name, price: removed.price, image: removed.image }, removed.qty);
    setRemoved(null);
  };

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key !== "website" && errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const errs = validate(form);
    setErrors(errs);
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) {
      setApiError(null);
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    if (!orderable.length) {
      setApiError("None of the items in your cart are available right now. Please remove them and pick another kit.");
      return;
    }

    setSubmitting(true);
    setApiError(null);
    const snapshot = { items: orderable, subtotal, shipping, total };
    try {
      const res = await fetch("/api/public/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
          notes: form.notes.trim(),
          website: form.website,
          items: orderable.map((l) => ({ slug: l.slug, qty: l.qty })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as OrderResponse;
      if (!res.ok || !data.ok) {
        setApiError(
          data.error ||
            (res.status === 429
              ? "Too many attempts from this network — please wait a few minutes and try again."
              : "We couldn’t place your order just now. Please try again in a moment — your cart is saved."),
        );
        return;
      }
      setPlaced({
        number: data.number || "—",
        total: typeof data.total === "number" ? data.total : snapshot.total,
        subtotal: snapshot.subtotal,
        shipping: snapshot.shipping,
        paymentLink: data.paymentLink || null,
        firstName: form.customerName.trim().split(/\s+/)[0] ?? "",
        items: snapshot.items,
      });
      clear();
      setForm(EMPTY_FORM);
      // An order placed, not yet a payment received (payment is confirmed in HQ). The HQ order number is never sent.
      track("purchase", {
        transaction_id: throwawayId(),
        value: typeof data.total === "number" ? data.total : snapshot.total,
        shipping: snapshot.shipping,
        currency: "INR",
        items: snapshot.items.map((l) => ({ item_id: l.slug, item_name: l.name, price: l.price, quantity: l.qty })),
      });
    } catch {
      setApiError("We couldn’t reach our server. Check your internet connection and try again — your cart is saved.");
    } finally {
      setSubmitting(false);
    }
  };

  let body: React.ReactNode;
  if (placed) body = <OrderSuccess order={placed} />;
  else if (!ready) body = <CartSkeleton />;
  else if (!lines.length) body = <EmptyCart catalog={catalog} />;
  else
    body = (
      <>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="00">Checkout</SectionLabel>
            <h1 className="mt-5 text-[clamp(2.6rem,6vw,4.8rem)] font-bold leading-[0.95] tracking-[-0.03em] text-graphite">Your cart.</h1>
          </div>
          <Steps current={1} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            {/* 01 · Lines */}
            <section aria-labelledby="cart-lines-title" className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
              <header className="flex items-center justify-between gap-4 border-b border-graphite/15 px-5 py-4 sm:px-6">
                <h2 id="cart-lines-title" className="flex items-center gap-3 text-lg font-bold tracking-[-0.01em] text-graphite">
                  <StepDot n="01" /> Your kits
                </h2>
                <Link href="/shop" className="annot inline-flex items-center gap-1.5 text-blueprint transition-colors hover:text-graphite">
                  <ShoppingBag className="size-3.5" aria-hidden /> Continue shopping
                </Link>
              </header>
              <ul>
                <AnimatePresence initial={false}>
                  {priced.map((l) => {
                    const [gradeLine] = splitGrades(l.grades);
                    return (
                      <motion.li
                        key={l.slug}
                        layout={!reduce}
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-b border-graphite/10 last:border-b-0"
                      >
                        <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                          <Link
                            href={`/shop/${l.slug}`}
                            tabIndex={-1}
                            aria-hidden
                            className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-graphite/10 bg-paper sm:w-32"
                          >
                            <ProductImage src={l.image} alt="" sizes="128px" quality={75} className={cn(!l.available && "grayscale")} />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                {gradeLine && <p className="annot text-blueprint">{gradeLine}</p>}
                                <h3 className="mt-0.5 font-bold leading-tight tracking-[-0.01em] text-graphite">
                                  <Link href={`/shop/${l.slug}`} className="hover:underline hover:decoration-graphite/40 hover:underline-offset-4">
                                    {l.name}
                                  </Link>
                                </h3>
                                <p className="tabular mt-1 text-sm text-charcoal">{formatINR(l.price)} each</p>
                              </div>
                              <p className={cn("tabular shrink-0 font-mono text-base font-bold", l.available ? "text-graphite" : "text-blueprint line-through")}>{formatINR(l.price * l.qty)}</p>
                            </div>
                            {!l.available && (
                              <p className="mt-2 flex items-start gap-1.5 text-xs text-bad">
                                <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                                Currently unavailable — it won&rsquo;t be included in this order.
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <QtyStepper size="sm" value={l.qty} onChange={(n) => setQty(l.slug, n)} max={50} label={`Quantity of ${l.name}`} disabled={!l.available} />
                              <button
                                type="button"
                                onClick={() => onRemove(l)}
                                className="annot inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-blueprint transition-colors hover:bg-bad/5 hover:text-bad"
                              >
                                <Trash2 className="size-3.5" aria-hidden /> Remove<span className="sr-only"> {l.name}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
              <UndoNotice removed={removed} onUndo={undo} className="border-t border-graphite/10" />
            </section>

            {/* 02 · Delivery */}
            <section aria-labelledby="delivery-title" className="relative mt-8 rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite/15 px-5 py-4 sm:px-6">
                <h2 id="delivery-title" className="flex items-center gap-3 text-lg font-bold tracking-[-0.01em] text-graphite">
                  <StepDot n="02" /> Delivery details
                </h2>
                <p className="annot text-blueprint">
                  <span className="text-bad">*</span> Required
                </p>
              </header>

              <form id="checkout-form" noValidate onSubmit={onSubmit} className="relative grid gap-5 p-5 sm:grid-cols-2 sm:p-6" aria-describedby="checkout-note">
                {apiError && (
                  <div ref={alertRef} role="alert" tabIndex={-1} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-bad/30 bg-bad/5 p-4 text-sm text-graphite outline-none sm:col-span-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />
                    <span>{apiError}</span>
                  </div>
                )}

                <Row id="co-customerName" label="Full name" required error={errors.customerName}>
                  <Input {...fieldProps("customerName", form, errors, update)} autoComplete="name" placeholder="Parent / guardian name" maxLength={120} />
                </Row>
                <Row id="co-phone" label="Mobile (WhatsApp preferred)" required error={errors.phone}>
                  <Input {...fieldProps("phone", form, errors, update)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98xxx xxxxx" maxLength={16} />
                </Row>
                <Row id="co-email" label="Email" help="Optional — for your order confirmation." error={errors.email} className="sm:col-span-2">
                  <Input {...fieldProps("email", form, errors, update)} type="email" autoComplete="email" placeholder="you@example.com" maxLength={160} />
                </Row>
                <Row id="co-address" label="Full address" required help="House / flat no., street, area, landmark and state." error={errors.address} className="sm:col-span-2">
                  <Textarea {...fieldProps("address", form, errors, update)} autoComplete="street-address" rows={3} maxLength={600} />
                </Row>
                <Row id="co-city" label="City / town" required error={errors.city}>
                  <Input {...fieldProps("city", form, errors, update)} autoComplete="address-level2" maxLength={80} />
                </Row>
                <Row id="co-pincode" label="PIN code" required error={errors.pincode}>
                  <Input
                    {...fieldProps("pincode", form, errors, (k, v) => update(k, v.replace(/\D/g, "").slice(0, 6)), "tabular font-mono tracking-[0.2em]")}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="6 digits"
                    maxLength={6}
                  />
                </Row>
                <Row id="co-notes" label="Notes" help="Optional — a gift message, a preferred delivery time, your child’s grade…" className="sm:col-span-2">
                  <Textarea {...fieldProps("notes", form, errors, update)} rows={2} maxLength={1000} />
                </Row>

                {/* Honeypot — invisible to people, tempting to bots */}
                <div aria-hidden className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
                  <label htmlFor="co-website">Website</label>
                  <input id="co-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
                </div>
              </form>
            </section>
          </div>

          {/* 03 · Summary */}
          <aside aria-labelledby="summary-title" className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-graphite text-paper shadow-[var(--shadow-lift)]">
                <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-80" aria-hidden />
                <div className="relative p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <h2 id="summary-title" className="flex items-center gap-3 text-lg font-bold tracking-[-0.01em]">
                      <StepDot n="03" light /> Order summary
                    </h2>
                    <span className="annot text-paper/55">
                      <span className="font-mono">{String(count).padStart(2, "0")}</span> {count === 1 ? "kit" : "kits"}
                    </span>
                  </div>

                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-paper/65">Subtotal</dt>
                      <dd className="tabular font-mono">{formatINR(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-paper/65">Shipping</dt>
                      <dd className="tabular font-mono">{shipping === 0 ? (subtotal > 0 ? "Free" : "—") : formatINR(shipping)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-paper/20 pt-4">
                      <dt className="font-semibold">Total</dt>
                      <dd className="tabular text-3xl font-bold tracking-[-0.02em]">{formatINR(total)}</dd>
                    </div>
                  </dl>
                  <p className="annot mt-1 text-right text-paper/45">All prices include GST</p>

                  <FreeShippingMeter subtotal={subtotal} />

                  <button type="submit" form="checkout-form" disabled={submitting || !orderable.length} className={buttonClass("light", "lg", "mt-6 w-full")}>
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden /> Placing your order…
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" aria-hidden /> Place order · {formatINR(total)}
                      </>
                    )}
                  </button>
                  <p id="checkout-note" className="mt-4 text-xs leading-relaxed text-paper/60">
                    No payment is taken on this page. We&rsquo;ll call or WhatsApp you within 24 hours to confirm your order and share a secure UPI / payment link.
                  </p>
                </div>
                <div className="hatch h-2.5 opacity-30" aria-hidden />
              </div>

              <ul className="mt-5 grid gap-2.5 text-sm text-charcoal">
                {[
                  { icon: PackageCheck, text: "Dispatched in 2–4 working days after confirmation (made-to-order kits: 5–7)" },
                  { icon: RotateCcw, text: "7-day replacement for defective items" },
                  { icon: FlaskConical, text: "Every kit pairs with a free JOVE Virtual Lab" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 size-4 shrink-0 text-blueprint" strokeWidth={1.7} aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-blueprint">
                See our{" "}
                <Link href="/shipping-policy" className="underline decoration-graphite/30 underline-offset-2 hover:text-graphite">
                  Shipping Policy
                </Link>{" "}
                and{" "}
                <Link href="/refund-policy" className="underline decoration-graphite/30 underline-offset-2 hover:text-graphite">
                  Refund &amp; Cancellation Policy
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </>
    );

  return (
    <section className="relative overflow-hidden pb-24 pt-28 sm:pb-32 sm:pt-36">
      <GridBackdrop />
      <div className="container-bp relative">
        {!placed && ready && !lines.length && <UndoNotice removed={removed} onUndo={undo} className="mb-8 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50" />}
        {body}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Pieces
 * ────────────────────────────────────────────────────────────────────────── */

function fieldProps(key: FormKey, form: FormState, errors: Errors, update: (k: FormKey, v: string) => void, extraClass?: string) {
  const id = `co-${key}`;
  return {
    id,
    name: key,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, e.target.value),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": `${id}-msg`,
    className: cn(errors[key] && "border-bad/60 focus:border-bad", extraClass) || undefined,
  };
}

function Row({ id, label, required, help, error, className, children }: { id: string; label: string; required?: boolean; help?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-bad" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </Label>
      {children}
      <p id={`${id}-msg`} className={cn("mt-1.5 min-h-4 text-xs", error ? "text-bad" : "text-blueprint")}>
        {error ?? help ?? ""}
      </p>
    </div>
  );
}

function StepDot({ n, light }: { n: string; light?: boolean }) {
  return (
    <span aria-hidden className={cn("grid size-8 place-items-center rounded-full border font-mono text-[11px] font-semibold", light ? "border-paper/30 text-paper/80" : "border-graphite/30 text-graphite")}>
      {n}
    </span>
  );
}

function Steps({ current }: { current: 1 | 2 }) {
  const steps = ["Cart & delivery", "Confirm & pay", "Dispatch"];
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const state = i + 1 < current ? "done" : i + 1 === current ? "current" : "todo";
        return (
          <li key={s} className="flex items-center gap-3" aria-current={state === "current" ? "step" : undefined}>
            <span className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold", state === "todo" ? "border-graphite/20 text-blueprint" : "border-graphite bg-graphite text-paper")}>
              {state === "done" ? <Check className="size-3.5" aria-hidden /> : <span className="font-mono text-[10px] opacity-70">{String(i + 1).padStart(2, "0")}</span>}
              {s}
              {state === "done" && <span className="sr-only"> (done)</span>}
            </span>
            {i < steps.length - 1 && <span className="hidden h-px w-6 bg-graphite/25 sm:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const pct = Math.min(1, subtotal / FREE_SHIPPING_ABOVE);
  const remaining = Math.max(0, FREE_SHIPPING_ABOVE - subtotal);
  const label = remaining > 0 ? `Add ${formatINR(remaining)} more for free shipping` : "Free shipping unlocked";
  return (
    <div className="mt-6 rounded-[var(--radius-md)] border border-paper/15 bg-paper/[0.04] p-4">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="size-4 shrink-0 text-paper/60" aria-hidden />
        <span className={remaining > 0 ? "text-paper/80" : "font-semibold"}>{label}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_ABOVE}
        aria-valuenow={Math.min(subtotal, FREE_SHIPPING_ABOVE)}
        aria-valuetext={label}
        className="relative mt-3 h-2 overflow-hidden rounded-full bg-paper/15"
      >
        <div className="h-full origin-left rounded-full bg-paper transition-transform duration-700 ease-[var(--ease-out-expo)]" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <p className="annot mt-2 flex justify-between text-paper/40">
        <span>{formatINR(SHIPPING_FLAT)} shipping</span>
        <span>Free ≥ {formatINR(FREE_SHIPPING_ABOVE)}</span>
      </p>
    </div>
  );
}

function UndoNotice({ removed, onUndo, className }: { removed: CartLine | null; onUndo: () => void; className?: string }) {
  return (
    <div aria-live="polite" className={cn(!removed && "hidden", className)}>
      {removed && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm text-charcoal sm:px-6">
          <span>
            Removed <strong className="font-semibold text-graphite">{removed.name}</strong> from your cart.
          </span>
          <button type="button" onClick={onUndo} className="annot inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/25 px-3 py-1.5 text-graphite transition-colors hover:bg-graphite hover:text-paper">
            <Undo2 className="size-3.5" aria-hidden /> Undo
          </button>
        </div>
      )}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading your cart…
      </p>
      <div className="h-4 w-32 animate-pulse rounded bg-graphite/10" />
      <div className="mt-6 h-16 w-72 max-w-full animate-pulse rounded bg-graphite/10" />
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4 rounded-[var(--radius-lg)] border border-graphite/10 bg-paper-50 p-5">
              <div className="aspect-[4/3] w-28 animate-pulse rounded-[var(--radius-md)] bg-graphite/10" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-24 animate-pulse rounded bg-graphite/10" />
                <div className="h-5 w-48 max-w-full animate-pulse rounded bg-graphite/10" />
                <div className="h-8 w-32 animate-pulse rounded bg-graphite/10" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] bg-graphite/15 lg:col-span-5" />
      </div>
    </div>
  );
}

function EmptyCart({ catalog }: { catalog: ShopProduct[] }) {
  const picks = catalog.filter((p) => p.available).slice(0, 4);
  return (
    <>
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionLabel index="00">Your cart</SectionLabel>
          <h1 className="mt-5 text-[clamp(2.6rem,6vw,4.8rem)] font-bold leading-[0.95] tracking-[-0.03em] text-graphite">
            Nothing here
            <br />
            <span className="text-blueprint">— yet.</span>
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-charcoal">
            Pick a kit for your child&rsquo;s grade. Each one is designed by the JOVE team and pairs with a free Virtual Lab — learn the idea online, then build it for real.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/shop" size="lg" arrow>
              Browse the kits
            </Button>
            <Button href="/labs" size="lg" variant="secondary">
              Try a free lab
            </Button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="relative rounded-[var(--radius-lg)] border border-graphite/15 bg-paper shadow-[var(--shadow-lift)]">
            <CornerMarks inset={-7} size={14} />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)]">
              <Image
                src="/images/misc/lost-robot.webp"
                alt="Pencil sketch of a small robot puzzling over a blueprint map"
                fill
                loading="eager"
                quality={75}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </div>

      {picks.length > 0 && (
        <div className="mt-20 border-t border-graphite/15 pt-12">
          <SectionLabel index="01">Start with a kit</SectionLabel>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {picks.map((p, i) => (
              <li key={p.slug} className="h-full">
                <ProductCard product={p} index={i} compact />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function OrderSuccess({ order }: { order: PlacedOrder }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [reduce]);

  const wa = whatsappLink(`Hi JOVE! I just placed order ${order.number} (${formatINR(order.total)}) on your website. Could you share the payment link?`);
  const labMap = new Map<string, LabMeta>();
  for (const it of order.items) for (const lab of labsFor(it.kitId)) labMap.set(lab.slug, lab);
  const labsToTry = [...labMap.values()].slice(0, 3);

  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel index="03">Order placed</SectionLabel>
          <h1 ref={headingRef} tabIndex={-1} className="mt-5 text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[0.95] tracking-[-0.03em] text-graphite outline-none">
            Thank you{order.firstName ? `, ${order.firstName}` : ""}.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-charcoal">Your order is in. Here&rsquo;s your reference — keep it handy when we get in touch.</p>
        </div>
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-graphite text-paper shadow-[var(--shadow-lift)]" aria-hidden>
          <Check className="size-7" strokeWidth={2.5} />
        </span>
      </div>

      {/* Receipt */}
      <div className="relative mt-10 rounded-[var(--radius-lg)] border border-graphite/20 bg-paper-50 shadow-[var(--shadow-lift)]">
        <CornerMarks inset={-7} size={14} />
        <div className="bp-grid-fine pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] opacity-40" aria-hidden />
        <div className="relative grid gap-6 border-b border-dashed border-graphite/25 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <p className="annot text-blueprint">Order number</p>
            <p className="mt-2 break-all font-mono text-2xl font-bold tracking-[0.04em] text-graphite sm:text-3xl" aria-live="polite">
              {order.number}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="annot text-blueprint">Order total · incl. GST</p>
            <p className="tabular mt-2 text-2xl font-bold tracking-[-0.02em] text-graphite sm:text-3xl">{formatINR(order.total)}</p>
          </div>
        </div>
        <ul className="relative divide-y divide-graphite/10 px-6 sm:px-8">
          {order.items.map((it) => (
            <li key={it.slug} className="flex items-center gap-4 py-4">
              <span className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-graphite/10 bg-paper">
                <ProductImage src={it.image} alt="" sizes="64px" quality={60} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-graphite">
                <span className="font-mono text-blueprint">{it.qty} ×</span> {it.name}
              </span>
              <span className="tabular font-mono text-sm text-graphite">{formatINR(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="relative space-y-2 border-t border-graphite/15 px-6 py-5 text-sm sm:px-8">
          <div className="flex justify-between">
            <dt className="text-charcoal">Subtotal</dt>
            <dd className="tabular font-mono">{formatINR(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-charcoal">Shipping</dt>
            <dd className="tabular font-mono">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-graphite/20 pt-2 font-bold text-graphite">
            <dt>Total</dt>
            <dd className="tabular font-mono">{formatINR(order.total)}</dd>
          </div>
        </dl>
        <div className="hatch h-3 rounded-b-[var(--radius-lg)] border-t border-graphite/20" aria-hidden />
      </div>

      {/* Payment */}
      {order.paymentLink ? (
        <div className="mt-8 flex flex-col gap-4 rounded-[var(--radius-lg)] bg-graphite p-6 text-paper shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-lg font-bold">Pay securely now</p>
            <p className="mt-1 text-sm text-paper/65">Opens our payment page in a new tab. Prefer UPI on a call? We&rsquo;ll still reach out within 24 hours.</p>
          </div>
          <Button href={order.paymentLink} external variant="light" size="lg" className="shrink-0">
            <CreditCard className="size-4" aria-hidden /> Pay {formatINR(order.total)} now
          </Button>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5 rounded-[var(--radius-lg)] bg-graphite p-6 text-paper shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-paper/25" aria-hidden>
              <PhoneCall className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold">We&rsquo;ll be in touch within 24 hours</p>
              <p className="mt-1 text-sm leading-relaxed text-paper/65">We&rsquo;ll call or WhatsApp you to confirm the order and share the UPI / payment link. Nothing is charged until you pay.</p>
            </div>
          </div>
          {wa && (
            <Button href={wa} external variant="light" className="shrink-0">
              <MessageCircle className="size-4" aria-hidden /> WhatsApp us
            </Button>
          )}
        </div>
      )}

      {/* Next steps */}
      <ol className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-graphite/15 sm:grid-cols-3">
        {[
          { icon: PhoneCall, title: "Confirm", text: "A quick call or WhatsApp from the JOVE team within 24 hours." },
          { icon: CreditCard, title: "Pay", text: "Secure UPI / payment link — prices already include GST." },
          { icon: Truck, title: "Dispatch", text: "Packed and shipped in 2–4 working days (made-to-order kits: 5–7), with tracking." },
        ].map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="bg-paper-50 p-5">
            <p className="flex items-center justify-between">
              <Icon className="size-5 text-graphite" strokeWidth={1.6} aria-hidden />
              <span className="font-mono text-xs tracking-widest text-blueprint">{String(i + 1).padStart(2, "0")}</span>
            </p>
            <p className="mt-4 font-bold text-graphite">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal">{text}</p>
          </li>
        ))}
      </ol>

      {labsToTry.length > 0 && (
        <div className="mt-14">
          <SectionLabel>While you wait</SectionLabel>
          <h2 className="mt-4 text-2xl font-bold tracking-[-0.02em] text-graphite sm:text-3xl">Start the free lab that goes with your kit.</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labsToTry.map((lab) => (
              <li key={lab.slug}>
                <Link href={`/labs/${lab.slug}`} className="group flex h-full items-center gap-4 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-3 pr-4 transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                  <span className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-paper">
                    <Image src={lab.image} alt="" fill sizes="80px" quality={60} className="object-cover mix-blend-multiply" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-tight text-graphite">{lab.title}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-blueprint">
                      <Clock className="size-3" aria-hidden /> ~{lab.minutes} min · Free
                    </span>
                  </span>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-graphite transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12 flex flex-wrap gap-3 border-t border-graphite/15 pt-8">
        <Button href="/shop" arrow>
          Continue shopping
        </Button>
        <Button href="/labs" variant="secondary">
          Explore Virtual Labs
        </Button>
      </div>
    </motion.div>
  );
}
