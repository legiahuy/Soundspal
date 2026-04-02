import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MapPin, MessageSquare, Facebook } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Soundspal team. We are here to help artists, venues, and organizers connect and thrive.',
  alternates: {
    canonical: `${APP_URL}/contact`,
  },
  openGraph: {
    title: 'Contact Soundspal',
    description: 'Get in touch with the Soundspal team.',
    url: `${APP_URL}/contact`,
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-primary/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto max-w-[1200px] px-4 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Have a question, suggestion, or just want to say hello? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Contact info */}
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Email</h2>
                  <p className="text-muted-foreground text-sm mb-2">Our team usually replies within 24 hours.</p>
                  <a
                    href="mailto:support@soundspal.com"
                    className="text-primary hover:underline font-medium"
                  >
                    support@soundspal.com
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Facebook className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Social Media</h2>
                  <p className="text-muted-foreground text-sm mb-2">Follow us and send us a message.</p>
                  <a
                    href="https://www.facebook.com/SoundspalHQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    facebook.com/SoundspalHQ
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Feedback Form</h2>
                  <p className="text-muted-foreground text-sm mb-2">Share your thoughts and help us improve.</p>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLScsjq8G5ish9640ma213FJ-vaQQDoOh5p7PjmMPys5pdiEnFw/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Submit feedback →
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Based in</h2>
                  <p className="text-muted-foreground text-sm">Ho Chi Minh City, Vietnam 🇻🇳</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links / CTA */}
          <div className="p-8 rounded-2xl bg-card border border-border/50 space-y-6">
            <h2 className="text-2xl font-bold">Looking for something specific?</h2>
            <p className="text-muted-foreground">
              You might find your answer faster in one of these sections.
            </p>
            <ul className="space-y-4">
              {[
                { href: '/help', label: 'Help Center', sub: 'Browse FAQs and guides' },
                { href: '/about', label: 'About Soundspal', sub: 'Learn about our mission' },
                { href: '/jobs', label: 'Browse Jobs', sub: 'Find music gigs & opportunities' },
                { href: '/discovery', label: 'Discover Talent', sub: 'Explore artist profiles' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">{link.label}</div>
                      <div className="text-sm text-muted-foreground">{link.sub}</div>
                    </div>
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
