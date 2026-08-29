import { HeroSection } from "@/components/home/hero-section"
import { SpecializationSection } from "@/components/home/Our Services"
import { AboutSection } from "@/components/home/about-section"
import { ContactSection } from "@/components/home/contact-section"

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <HeroSection />

      {/* Our Services */}
      <SpecializationSection />

      {/* About N2P */}
      <AboutSection />

      {/* Contact */}
      <ContactSection />
    </main>
  )
}
