import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { CartProvider } from "@/components/site/CartProvider";
import { Preloader } from "@/components/site/Preloader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Preloader />
      <SmoothScroll />
      <Navbar />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}
