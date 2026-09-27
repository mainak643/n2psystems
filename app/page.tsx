import { HeroSection } from "@/components/home/hero-section"
import { SpecializationSection } from "@/components/home/Our Services"
import { AboutSection } from "@/components/home/about-section"
import { ContactSection } from "@/components/home/contact-section"
import { FaqSection } from "@/components/seo/faq-section"
import { COMPANY_FAQ } from "@/lib/seo-schema"

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <HeroSection />

      {/* Our Services */}
      <SpecializationSection />

      {/* About N2P */}
      <AboutSection />

      {/* FAQ — visible Q&A with matching FAQPage markup */}
      <FaqSection items={COMPANY_FAQ} title="Questions we hear most" />

      {/* Contact */}
      <ContactSection />
    </main>
  )
}
