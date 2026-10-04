import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { CartProvider } from "@/components/site/CartProvider";
import { Preloader } from "@/components/site/Preloader";
import { Analytics } from "@/components/site/Analytics";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Preloader />
      <SmoothScroll />
      {/* first in the tab order; it is position: fixed, so this does not change where it appears */}
      <Analytics />
      <Navbar />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}
