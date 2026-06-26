import { HeroSection } from "@/components/home/hero-section"
import { SpecializationSection } from "@/components/home/Our Services"
// import { AudienceSection } from "@/components/home/audience-section"
import { AboutSection } from "@/components/home/about-section"
import { ContactSection } from "@/components/home/contact-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <HeroSection />

      {/* Our Services */}
      <SpecializationSection />

      {/* About N2P */}
      <AboutSection />

      {/* Client Success */}
      <TestimonialsSection />

      {/* Contact */}
      <ContactSection />
    </main>
  )
}
