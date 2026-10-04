import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalLayout, type LegalSection } from "@/components/site/legal/LegalLayout";
import { A, DataTable, Note, P, ReachUs, UL } from "@/components/site/legal/prose";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How JOVE collects, uses and protects personal data — including children's data, which we process only with verifiable parental consent obtained through the school — under India's IT Act 2000 and the DPDP Act 2023.",
  alternates: { canonical: "/privacy" },
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <P>
          This policy is issued by <strong>{site.legalName}</strong> (“JOVE”, “we”, “us”), a company based in {site.location} that runs Robotics, AI &amp; Machine Learning workshops in schools, publishes free Virtual Labs
          online and sells robotics kits. Our in-house production studio is {site.studio.name}.
        </P>
        <P>
          For the personal data described below, JOVE is the “data fiduciary” (the party that decides why and how the data is processed) under the Digital Personal Data Protection Act, 2023 (“DPDP Act”). Where a school
          shares its students’ details with us to run a workshop, the school and JOVE each have responsibilities, set out in section 3.
        </P>
        <P>
          <strong>Grievance contact:</strong> {site.founders[0].name}, {site.founders[0].role}. See section 12 for how to reach him.
        </P>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect, and why",
    body: (
      <>
        <P>We collect only what we need for the purpose shown. Nothing here is sold or rented to anyone.</P>
        <DataTable
          caption="Personal data we collect, by situation"
          head={["When", "What we collect", "Why"]}
          rows={[
            [
              "You send an enquiry (contact form)",
              "Name, phone, email, school or organisation, role, city, approximate student numbers, preferred date, your message, the page you wrote from",
              "To call you back, prepare a proposal and run the booking",
            ],
            [
              "You order a kit from the online store",
              "Name, phone, email, delivery address, pincode, items, order notes",
              "To confirm, pack, ship and support your order, and to issue a GST invoice",
            ],
            [
              "A school books a JOVE Day",
              "School and contact-person details; class-wise student counts; where needed, student first names or roll numbers for teams, attendance and certificates",
              "To plan and deliver the workshop and issue certificates",
            ],
            [
              "Students attend a workshop",
              "Student name, grade and school for certificates; photographs and video (only as described in section 4)",
              "To issue certificates and to produce the school’s Media Pack",
            ],
            [
              "You use our Virtual Labs",
              "No sign-up or account. Your progress is stored in your own browser (local storage)",
              "To remember where you left off; it never leaves your device",
            ],
            [
              "You verify a certificate",
              "The certificate ID you type",
              "To look the certificate up and show the result",
            ],
            [
              "You browse the website",
              "Basic technical data such as browser type and pages requested, in standard server logs",
              "To keep the site secure and working",
            ],
          ]}
        />
        <P>
          Payments for store orders are completed on the payment provider’s own page. We do not see or store your card, UPI PIN or net-banking credentials.
        </P>
      </>
    ),
  },
  {
    id: "children",
    title: "Children’s data & parental consent",
    body: (
      <>
        <P>
          Our workshops are for students in Grades 1 to 10, so most of the people we teach are under 18. Under the DPDP Act, a person below 18 is a “child”, and processing a child’s personal data requires{" "}
          <strong>verifiable consent from a parent or lawful guardian</strong>. This is how we handle that:
        </P>
        <UL
          items={[
            <span key="1">
              <strong>Consent comes through the school.</strong> Before a JOVE Day, we give the school a short consent form for parents and guardians. The school, which already has a relationship with parents, collects it. We
              keep the record of consent, and we process a child’s data only where consent is on record.
            </span>,
            <span key="2">
              <strong>Minimum data.</strong> We do not ask children to create accounts or enter personal details on this website. Our Virtual Labs work without sign-up.
            </span>,
            <span key="3">
              <strong>No tracking or targeting.</strong> We do not track or behaviourally monitor children, and we do not show them targeted advertising. We never use a child’s data for marketing to that child.
            </span>,
            <span key="4">
              <strong>No consent, no processing.</strong> If a parent does not consent, the student can still take part in the workshop; we simply do not photograph or film them, and we leave their details off any list we keep.
            </span>,
            <span key="5">
              <strong>Parents are in control.</strong> A parent or guardian can ask us at any time to show, correct or delete their child’s data, or to withdraw consent (section 9).
            </span>,
          ]}
        />
        <Note title="Where schools fit in">
          <p>
            Schools share only the student details needed for the workshop (usually counts, and names or roll numbers for certificates). We ask schools to confirm that they have parental consent on file before sharing anything
            beyond headcounts.
          </p>
        </Note>
      </>
    ),
  },
  {
    id: "media",
    title: "Photos, video & media consent",
    body: (
      <>
        <P>
          Every JOVE Day is filmed by {site.studio.name} to produce the school’s Media Pack: reels, a full-day film, drone shots and photographs. Because this involves children’s images, we treat media as a separate, explicit
          consent.
        </P>
        <UL
          items={[
            "Students are filmed or photographed in an identifiable way only where a parent or guardian has consented in writing through the school.",
            "Students without consent are kept out of identifiable shots, or their faces are blurred, and we tell the crew before filming starts.",
            "The school may use the delivered media for its own marketing and admissions. JOVE may use the media in its portfolio; students’ faces are blurred on request.",
            "We do not sell media of children to third parties, and we do not use it in paid advertising for products other than JOVE’s own services without fresh consent.",
            "To withdraw media consent, contact us (section 12). We will stop using the images and remove them from channels we control within 7 working days of a verified request. We cannot recall copies that a school or a third party has already downloaded or shared.",
          ]}
        />
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use information",
    body: (
      <UL
        items={[
          "To respond to enquiries, prepare proposals and run bookings.",
          "To deliver workshops, issue certificates and produce Media Packs.",
          "To process, ship and support store orders, and to keep accounting records.",
          "To keep our website and systems secure and to fix problems.",
          "To meet legal, tax and accounting obligations.",
          "To contact you about the specific enquiry or order you made. We send promotional messages only if you have asked to receive them, and you can opt out at any time.",
        ]}
      />
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    body: (
      <>
        <P>We share personal data only where needed to do what you asked, and only with:</P>
        <UL
          items={[
            <span key="1">
              <strong>The school</strong> concerned — for example, the certificates and Media Pack for its own students.
            </span>,
            <span key="2">
              <strong>Service providers</strong> who work for us under confidentiality: website hosting and storage, payment providers, courier and logistics partners, and communication tools (SMS, WhatsApp, email).
            </span>,
            <span key="3">
              <strong>Professional advisers</strong> such as our chartered accountant and legal counsel, where needed.
            </span>,
            <span key="4">
              <strong>Authorities</strong>, where the law requires it or to protect the safety of children.
            </span>,
          ]}
        />
        <P>
          Some of our service providers may process data on servers outside India. We choose providers with appropriate security practices and share only what is necessary.
        </P>
      </>
    ),
  },
  {
    id: "security",
    title: "Storage & security",
    body: (
      <>
        <P>
          We keep personal data in access-controlled systems. Staff and trainers see only what their role needs, and sign-in is required for our internal portal. Our website uses encrypted connections (HTTPS).
        </P>
        <P>
          No system is perfectly secure. If a personal-data breach affects you, we will notify you and the relevant authority as the law requires, and tell you what we are doing about it.
        </P>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    body: (
      <>
        <P>We keep data only as long as it is useful for its purpose or the law requires. Our standard periods are:</P>
        <DataTable
          caption="Data retention periods"
          head={["Data", "How long"]}
          rows={[
            ["Enquiries and leads", "Up to 24 months after the last interaction, then deleted"],
            ["Student lists and attendance", "Deleted or anonymised within 12 months of the workshop"],
            ["Parental consent records", "For as long as we hold the related student data or media, plus 12 months"],
            ["Certificate record (name, grade, school, programme, date)", "Kept so that certificates remain verifiable at /verify; removable on request"],
            ["Raw photo and video footage", "Up to 24 months after delivery to the school, then deleted"],
            ["Final films and reels in our portfolio", "While consent covers them, until you or a parent withdraws it"],
            ["Orders, invoices and accounting records", "For the period required by tax and company law (typically 6 to 8 years)"],
          ]}
        />
        <P>
          Statutory retention periods depend on the type of record; we confirm them with our chartered accountant.
        </P>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <P>Under the DPDP Act and applicable Indian law you can:</P>
        <UL
          items={[
            "ask for a summary of the personal data we hold about you and how we use it;",
            "ask us to correct inaccurate or incomplete data, or to erase data we no longer need;",
            "withdraw consent you have given — it is as easy to withdraw as it was to give, and withdrawal does not affect what we did before you withdrew;",
            "nominate someone to exercise these rights for you in the event of your death or incapacity;",
            "use our grievance process and, if you are not satisfied, approach the Data Protection Board of India as the Act provides.",
          ]}
        />
        <P>
          A parent or lawful guardian can exercise all of these rights for a child. To make a request, use the contact options in section 12 and tell us who you are, who the data is about and (for a school) which school and workshop
          date. We may ask for proof of identity or of guardianship before acting. We aim to acknowledge requests within 3 working days and resolve them within 30 days.
        </P>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies & local storage",
    body: (
      <>
        <P>
          This website uses a small number of essential items stored in your browser: your shopping cart, your Virtual Lab progress, and (for staff) a sign-in session for our internal portal. These stay on your device and are used
          only to make the site work.
        </P>
        <P>
          We do not use advertising cookies or sell data to advertisers. If we add analytics later, we will describe it here and, where required, ask for your consent first. You can clear local storage at any time from your
          browser settings; doing so resets your cart and lab progress.
        </P>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Links to other websites",
    body: (
      <P>
        Our pages link to sites we do not run, including {site.studio.name} and social media. They have their own privacy practices, and this policy does not cover them. Please read their policies before sharing personal data.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <P>
        We may update this policy as our services or the law change. The “Last updated” date at the top shows the current version. If a change materially affects how we handle personal data, we will tell schools and customers we
        have a contact for, and we will not apply the change to data collected earlier in a way that reduces your rights without asking you first.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact & grievances",
    body: (
      <>
        <P>
          For any privacy question, request or complaint, contact our grievance officer, {site.founders[0].name} ({site.founders[0].role}), in any of these ways:
        </P>
        <ReachUs subject="Privacy" />
        <P>
          We will acknowledge your message within 3 working days and tell you what we found and did. See also our <A href="/terms">Terms of Service</A> and <A href="/refund-policy">Refund &amp; Cancellation Policy</A>.
        </P>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      index="LEGAL 01"
      eyebrow="Privacy Policy"
      title={["Your data,", "handled with care."]}
      intro="We work with children, so we hold ourselves to a higher standard. This policy explains what we collect, why, who sees it and how you stay in control — under India’s IT Act, 2000 and the Digital Personal Data Protection Act, 2023."
      summary={[
        "Children’s data is processed only with verifiable parental consent, collected through the school.",
        "Photos and video of students need separate, written consent — and students without it stay out of frame.",
        "We never sell personal data, and we do not track or target children with advertising.",
        "You can ask to see, correct, delete or withdraw consent for any data we hold — parents can do this for their child.",
      ]}
      sections={sections}
      current="/privacy"
    />
  );
}
