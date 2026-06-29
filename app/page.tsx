import dynamic from "next/dynamic"
import { HeroSection } from "@/components/home/hero-section"

const SpecializationSection = dynamic(() => import("@/components/home/Our Services").then(mod => mod.SpecializationSection), { ssr: true })
const AboutSection = dynamic(() => import("@/components/home/about-section").then(mod => mod.AboutSection), { ssr: true })
const TestimonialsSection = dynamic(() => import("@/components/home/testimonials-section").then(mod => mod.TestimonialsSection), { ssr: true })
const ContactSection = dynamic(() => import("@/components/home/contact-section").then(mod => mod.ContactSection), { ssr: true })

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
