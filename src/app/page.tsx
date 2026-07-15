import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import FocusAreas from "@/components/sections/FocusAreas";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <FocusAreas />
      </main>
      <Footer />
    </>
  );
}
