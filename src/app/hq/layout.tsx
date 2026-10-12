import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "JOVE HQ", template: "%s · JOVE HQ" },
  robots: { index: false, follow: false },
};

export default function HqRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
