import type { Metadata } from "next";
import { joveDayRules, mediaPack } from "@/lib/content/business";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT } from "@/lib/shop";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { LegalLayout, type LegalSection } from "@/components/site/legal/LegalLayout";
import { A, DataTable, H3, Note, OL, P, ReachUs, UL } from "@/components/site/legal/prose";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply to using the JOVE website, booking a JOVE Day workshop, buying robotics kits and using our free Virtual Labs: bookings, payments, media rights, liability and governing law (India).",
  alternates: { canonical: "/terms" },
};

const advance = (joveDayRules.minimumBilling * joveDayRules.advancePercent) / 100;

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <P>
          These terms are between you and <strong>{site.legalName}</strong> (“JOVE”, “we”, “us”), based in {site.location}. They apply when you use this website, book or attend a JOVE workshop, order from our online
          store or use our Virtual Labs.
        </P>
        <P>
          By using our website or placing a booking or order, you agree to these terms and to our <A href="/privacy">Privacy Policy</A>, <A href="/refund-policy">Refund &amp; Cancellation Policy</A> and{" "}
          <A href="/shipping-policy">Shipping Policy</A>, which form part of them. If you do not agree, please do not use our services.
        </P>
        <P>
          If you sign a proposal or booking for a school, you confirm that you are authorised to do so on the school’s behalf. If a proposal or written agreement with a school says something different from these
          terms, the proposal or agreement applies for that booking.
        </P>
      </>
    ),
  },
  {
    id: "services",
    title: "Our services",
    body: (
      <>
        <UL
          items={[
            <span key="1">
              <strong>JOVE Day and programmes:</strong> full-day Robotics, AI &amp; Machine Learning workshops delivered in schools for Grades 1 to 10, plus the Quarter, Year and Club programmes described on our{" "}
              <A href="/packages">Packages</A> page.
            </span>,
            <span key="2">
              <strong>{mediaPack.name}:</strong> reels, a full-day film, drone shots and photographs produced by {site.studio.name} and included with every JOVE Day.
            </span>,
            <span key="3">
              <strong>Virtual Labs:</strong> free, browser-based learning journeys (theory, demo, hands-on simulation and a challenge).
            </span>,
            <span key="4">
              <strong>Online store:</strong> robotics and AI kits sold to parents, students, schools and clubs.
            </span>,
          ]}
        />
        <P>
          Descriptions on this website are summaries. For a workshop, the proposal and booking confirmation we send you set out the exact scope, date, schedule and price.
        </P>
      </>
    ),
  },
  {
    id: "bookings",
    title: "Workshop bookings",
    body: (
      <>
        <P>A JOVE Day is booked in four steps: enquiry, call and campus visit or online demo, written proposal, and a confirmed date once the advance is received. A date is not reserved until we confirm it in writing.</P>
        <DataTable
          caption="Standard JOVE Day booking terms"
          head={["Term", "Standard position"]}
          rows={[
            ["Minimum size", `${joveDayRules.minimumStudents} students per JOVE Day`],
            ["Minimum billing", `${formatINR(joveDayRules.minimumBilling)} per JOVE Day, before GST`],
            ["Maximum per day", `${joveDayRules.maxStudentsPerDay} students, in sessions by grade group`],
            ["Advance to lock the date", `${joveDayRules.advancePercent}% of the proposal value`],
            ["Balance", `Within ${joveDayRules.balanceDueDays} days of the JOVE Day`],
          ]}
        />
        <H3>What the school provides</H3>
        <P>
          A hall or classrooms for each session, a projector or screen, power points, tables for team stations, and permission for photography and drone shots. We bring the kits, trainers, film crew and everything
          else on the day.
        </P>
        <H3>What JOVE provides</H3>
        <P>
          A trained team, the age-appropriate programme for each grade group, all workshop kits and consumables, certificates, and the {mediaPack.name}. We will make reasonable efforts to start and finish on the
          schedule in your proposal, and will tell you promptly if anything changes.
        </P>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Pricing, GST & payments",
    body: (
      <>
        <P>
          Workshop fees are quoted in Indian rupees (₹) per student by grade group, as shown in your proposal. GST is charged as applicable (currently {joveDayRules.gstPercent}% on our workshop services) and is shown
          separately on every invoice. Please give us your school’s GSTIN, legal name and billing address before we issue an invoice.
        </P>
        <P>
          To lock a date, we ask for an advance of {joveDayRules.advancePercent}% of the proposal value. For the smallest JOVE Day ({formatINR(joveDayRules.minimumBilling)} before GST) that is {formatINR(advance)} plus
          GST. The balance is due within {joveDayRules.balanceDueDays} days of the JOVE Day. Payment details (bank transfer or UPI) are printed on the invoice.
        </P>
        <P>
          Kit prices on the store are shown in rupees at checkout. Shipping is {formatINR(SHIPPING_FLAT)} on orders below {formatINR(FREE_SHIPPING_ABOVE)} and free on orders of {formatINR(FREE_SHIPPING_ABOVE)} or
          more (see our <A href="/shipping-policy">Shipping Policy</A>). Payment is taken through the payment provider we link to; we never see or store your card or UPI credentials.
        </P>
        <P>
          Prices can change from time to time. A price you have accepted in a written proposal, or paid for at checkout, will not change for that booking or order.
        </P>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "Cancellations, rescheduling & refunds",
    body: (
      <>
        <P>Our <A href="/refund-policy">Refund &amp; Cancellation Policy</A> sets out the rules in full. In short:</P>
        <UL
          items={[
            "Workshop dates can be rescheduled free of charge up to 7 days before the date.",
            "If you cancel within 7 days, 25% of the advance is retained. Within 48 hours, the advance is non-refundable, except in a force majeure event.",
            "Kits: a 7-day replacement for items that are defective or damaged on arrival, and returns of unopened kits within 7 days (less shipping).",
          ]}
        />
      </>
    ),
  },
  {
    id: "safety",
    title: "Student safety & school responsibilities",
    body: (
      <>
        <P>Student safety comes first on every JOVE Day. To keep it that way:</P>
        <UL
          items={[
            "Our trainers are background-verified and trained on our safety SOP and child-protection policy, and work under a founder’s supervision. Workshop kits are low-voltage and child-safe.",
            "School teachers or staff remain responsible for the general supervision, discipline and welfare of their students throughout the day, with our team leading the activities.",
            "The school tells us in advance about any student with a medical condition, allergy or special need we should know about, and ensures the venue is safe and accessible.",
            "The school collects parental consent for participation where its policy requires it, and for photography and video (see the Privacy Policy and the media section below), before the day.",
            "Students follow the trainers’ safety instructions. We may pause an activity, or exclude a specific item or activity, if we believe it is unsafe.",
          ]}
        />
      </>
    ),
  },
  {
    id: "media",
    title: "Photos, video & media rights",
    body: (
      <>
        <P>
          {site.studio.name} films every JOVE Day. Media is produced and used on the following basis:
        </P>
        <UL
          items={[
            "Delivered media (reels, film, photographs and so on) is licensed to the school for its own marketing and admissions use, at no extra charge.",
            "JOVE may use the media in its portfolio. Students’ faces are blurred on request, and consent forms are collected through the school.",
            "Students are filmed in an identifiable way only where a parent or guardian has consented. Students without consent are kept out of identifiable shots.",
            "Drone shots are subject to local rules and the school’s permission. We will not fly where the school or the law does not allow it.",
            "Neither the school nor JOVE may use the media in a way that is misleading, defamatory or unlawful, or that presents it as an endorsement by someone who has not given one.",
          ]}
        />
        <Note title="In the proposal">
          <p>
            The exact deliverables and delivery windows of the {mediaPack.name} are listed in your proposal. The Media Pack is included free with the JOVE Day and has no separate cash value or refund.
          </p>
        </Note>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <>
        <P>
          The website, its text, graphics, brand, logo and design, our curriculum and workbooks, the Virtual Labs and the design of our kits belong to JOVE or its licensors. You may view and use them for personal,
          educational and non-commercial purposes. You may not copy, scrape, resell, republish or build on them for commercial use, or use the JOVE name or logo, without our written permission.
        </P>
        <P>
          A school may use the printed workbooks and materials we hand out during a workshop for that school’s own teaching. Projects and models built by students belong to the students. We may show them (without
          identifying details unless consent is on record) to illustrate our work.
        </P>
      </>
    ),
  },
  {
    id: "labs",
    title: "Virtual Labs",
    body: (
      <>
        <P>
          Our Virtual Labs are free and need no account. They are provided for learning and are offered “as is”. Your progress is stored in your own browser, so clearing site data resets it.
        </P>
        <P>
          The certificate you can print at the end of a lab is a self-service record of completion. It is not a verified credential and is not recognised by any board or authority. Only certificates issued by JOVE
          after a workshop can be verified on our <A href="/verify">certificate checker</A>.
        </P>
      </>
    ),
  },
  {
    id: "store",
    title: "Online store",
    body: (
      <>
        <P>
          When you place an order, we confirm it by sending you an order number. A contract for the sale is formed when we confirm your order and receive your payment. Products are subject to availability. If an item
          is out of stock or a price was shown wrongly, we will tell you and either correct the order with your agreement or refund you in full.
        </P>
        <P>
          Each kit lists the grades it is designed for. Younger children should use kits with an adult’s supervision, and small parts are not suitable for very young children. Please read the guide in the box before
          you start.
        </P>
        <P>
          Delivery is covered by our <A href="/shipping-policy">Shipping Policy</A>, and returns and replacements by our <A href="/refund-policy">Refund &amp; Cancellation Policy</A>. Nothing in those policies affects
          your rights under the Consumer Protection Act, 2019.
        </P>
      </>
    ),
  },
  {
    id: "use",
    title: "Using the website",
    body: (
      <>
        <P>Please use the website lawfully and considerately. You agree not to:</P>
        <UL
          items={[
            "submit false or someone else’s personal details in a form, or use the forms to send spam or advertising;",
            "try to access the internal portal, other people’s data or our systems without authority, or probe or disrupt them;",
            "scrape the website at scale, or use automated tools that place a burden on it;",
            "upload or send anything harmful, unlawful or infringing.",
          ]}
        />
        <P>We may restrict access to the website for anyone who breaks these rules.</P>
      </>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers & limits of liability",
    body: (
      <>
        <P>
          We take care to run a safe, well-organised and educational workshop, but we cannot promise particular learning outcomes, exam results or admissions results. Information on this website is for general guidance
          and is provided “as is”.
        </P>
        <P>
          To the extent the law allows, JOVE is not liable for indirect or consequential loss, or for loss of profit, reputation or opportunity. Our total liability to you for any claim connected with a workshop or
          order is limited to the amount you paid us for that workshop or order.
        </P>
        <P>
          Nothing in these terms limits liability that cannot be limited under applicable law, including liability for fraud, wilful misconduct or, where the law applies, death or personal injury caused by negligence,
          or your rights as a consumer.
        </P>
      </>
    ),
  },
  {
    id: "force-majeure",
    title: "Events beyond our control",
    body: (
      <P>
        Neither party is responsible for delay or failure caused by events beyond its reasonable control, for example natural disasters, floods, extreme weather, epidemics, government or school-closure orders, strikes,
        major transport or power disruption, or an emergency affecting the venue. If this stops a JOVE Day from going ahead, we will work with you in good faith to reschedule it or, if you prefer, refund the advance, as
        set out in our <A href="/refund-policy">Refund &amp; Cancellation Policy</A>.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <P>
        We may update these terms from time to time. The “Last updated” date at the top shows the current version. A booking or order is governed by the terms in force on the date you confirmed it. Continuing to use
        the website after a change means you accept the updated terms.
      </P>
    ),
  },
  {
    id: "law",
    title: "Governing law & disputes",
    body: (
      <>
        <P>
          These terms are governed by the laws of India. If a problem comes up, please first <A href="/contact">talk to us</A>. Most issues are solved by a conversation between a founder and the school, and we will
          always try to find a fair answer. If we cannot resolve it informally, the courts at the place of JOVE’s registered office have jurisdiction, subject to any rights you have as a consumer to approach the forum
          the law allows.
        </P>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <P>Questions about these terms? Reach us in any of these ways.</P>
        <OL items={["Tell us what you need, and which booking or order it concerns, if any.", "We reply within one working day and, if it needs a decision, a founder will call you."]} />
        <ReachUs subject="Terms" />
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      index="LEGAL 02"
      eyebrow="Terms of Service"
      title={["The ground rules,", "in plain English."]}
      intro="These terms cover using our website, booking a JOVE Day, ordering a kit and learning with our Virtual Labs. We have kept them as short and clear as we can while still being precise."
      summary={[
        `A JOVE Day needs ${joveDayRules.minimumStudents}+ students. You pay ${joveDayRules.advancePercent}% in advance to lock the date and the balance within ${joveDayRules.balanceDueDays} days of the day. GST is shown separately.`,
        "Schools stay responsible for supervising students. Our verified trainers lead the activities.",
        "You may use the delivered media for your school’s own marketing and admissions. We may show it in our portfolio, with faces blurred on request.",
        "These terms are governed by Indian law, and our refund and shipping policies are part of them.",
      ]}
      sections={sections}
      current="/terms"
    />
  );
}
