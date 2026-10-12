import type { Metadata } from "next";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT } from "@/lib/shop";
import { formatINR } from "@/lib/utils";
import { LegalLayout, type LegalSection } from "@/components/site/legal/LegalLayout";
import { ShippingJourney } from "@/components/site/legal/figures";
import { A, DataTable, H3, Note, OL, P, ReachUs, UL } from "@/components/site/legal/prose";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: `How JOVE ships robotics kits across India: dispatch in 2–4 working days, delivery in 4–8 working days, ${formatINR(SHIPPING_FLAT)} shipping below ${formatINR(FREE_SHIPPING_ABOVE)} and free above, with tracking by SMS or WhatsApp.`,
  alternates: { canonical: "/shipping-policy" },
};

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "What this policy covers",
    body: (
      <>
        <P>
          This policy applies to kits and other products ordered from the JOVE online store and delivered to an address in India. Workshop kits used on a JOVE Day travel with our team, so they are not shipped.
        </P>
        <P>
          Returns and replacements are covered in our <A href="/refund-policy">Refund &amp; Cancellation Policy</A>, and the overall terms of sale in our <A href="/terms">Terms of Service</A>.
        </P>
      </>
    ),
  },
  {
    id: "where",
    title: "Where we deliver",
    body: (
      <>
        <P>
          We deliver across India through courier partners, to any pincode they serve. Please enter a correct six-digit pincode at checkout. If your pincode is outside our couriers’ network, we will tell you straight away
          and refund anything you have paid.
        </P>
        <P>We do not ship outside India at present.</P>
      </>
    ),
  },
  {
    id: "times",
    title: "Dispatch and delivery times",
    body: (
      <>
        <DataTable
          caption="Shipping timelines for store orders"
          head={["Stage", "Time"]}
          rows={[
            ["Order processing and dispatch", "2–4 working days after your order is confirmed (5–7 working days for kits marked Made to order)"],
            ["Delivery", "4–8 working days across India, counted from order confirmation"],
          ]}
        />
        <P>
          Working days are Monday to Saturday, excluding public holidays. An order is “confirmed” once we have received your payment and sent you the order number. Remote locations, festival periods and weather can add a
          few days, and we will tell you if we expect a longer wait.
        </P>
        <P>School and bulk orders ship to the school’s address, and the delivery window is quoted with the order.</P>
      </>
    ),
  },
  {
    id: "charges",
    title: "Shipping charges",
    body: (
      <>
        <DataTable
          caption="Shipping charges by order value"
          head={["Order value (before shipping)", "Shipping"]}
          rows={[
            [`Below ${formatINR(FREE_SHIPPING_ABOVE)}`, `${formatINR(SHIPPING_FLAT)} flat`],
            [`${formatINR(FREE_SHIPPING_ABOVE)} or more`, "Free"],
          ]}
        />
        <P>The shipping charge for your order is shown in your cart before you pay, so there are no surprises at checkout. Bulk and school quotes can have their own shipping terms, which are stated in the quote.</P>
      </>
    ),
  },
  {
    id: "tracking",
    title: "Tracking your order",
    body: (
      <>
        <P>
          When your order is dispatched, we send a tracking link by SMS or WhatsApp to the phone number you gave us (and by email, if you shared one). You can follow the parcel with the courier from there.
        </P>
        <P>Please keep your phone reachable around the delivery date. The courier will usually call before delivering.</P>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Receiving your parcel",
    body: (
      <>
        <UL
          items={[
            "Please give a complete address with a landmark and a phone number that will be answered. Couriers usually make more than one delivery attempt.",
            "If delivery fails and the parcel comes back to us, we will contact you to re-send it. A re-shipping charge may apply when the failure was due to a wrong address or an unreachable number.",
            "If the parcel has not reached you within the delivery window above, write to us with your order number and we will chase the courier and keep you updated.",
          ]}
        />
      </>
    ),
  },
  {
    id: "damaged",
    title: "Damaged, missing or wrong items",
    body: (
      <>
        <P>Please check your parcel when it arrives. If the outer packaging looks damaged, tell the delivery person and, if you can, record a short video as you open it. If anything is damaged, missing or not what you ordered:</P>
        <OL
          items={[
            "Tell us within 7 days of delivery through the contact page, or by replying to your order confirmation.",
            "Send your order number, photos of the parcel and the item, and the unboxing video if you have it.",
            "We will send a replacement or the missing part at no cost to you. If we cannot, we will refund the item, including shipping.",
          ]}
        />
        <Note title="Faster with proof">
          <p>Photos and an unboxing video are not a condition for help, but they let us settle the claim with the courier quickly, so your replacement leaves sooner.</p>
        </Note>
      </>
    ),
  },
  {
    id: "contact",
    title: "Questions about a delivery",
    body: (
      <>
        <H3>Need help with an order?</H3>
        <P>Tell us your order number and what is wrong. A founder will reply within one working day.</P>
        <ReachUs subject="Shipping" />
      </>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <LegalLayout
      index="LEGAL 04"
      eyebrow="Shipping Policy"
      title={["From our desk", "to your doorstep."]}
      intro="How store orders get to you: how long it takes, what it costs, how you can track it and what happens if something goes wrong on the way."
      summary={[
        "We dispatch within 2–4 working days (5–7 for made-to-order kits), and most orders arrive 4–8 working days after dispatch across India.",
        `Shipping is ${formatINR(SHIPPING_FLAT)} on orders below ${formatINR(FREE_SHIPPING_ABOVE)} and free on orders of ${formatINR(FREE_SHIPPING_ABOVE)} or more.`,
        "We send a tracking link by SMS or WhatsApp as soon as your parcel ships.",
        "If something arrives damaged or incomplete, tell us within 7 days and we will replace it.",
      ]}
      sections={sections}
      current="/shipping-policy"
      figure={<ShippingJourney />}
    />
  );
}
