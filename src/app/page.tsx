import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";

import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import FocusAreas from "@/components/sections/FocusAreas";

export default function Home() {
  return (
    <div id="top">
      <Header />
      <main>
        <Hero />
        <About />
        <FocusAreas />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
