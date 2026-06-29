import Hero from "@/sections/Hero";
import About from "@/sections/About";
import VisionMission from "@/sections/VisionMission";
import OrgStructure from "@/sections/OrgStructure";
import Gallery from "@/sections/Gallery";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <About />
        <VisionMission />
        <OrgStructure />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}
