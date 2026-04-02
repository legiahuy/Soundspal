import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export const metadata: Metadata = {
  title: 'Help Center',
  description:
    'Find answers to frequently asked questions about Soundspal. Learn how to create a profile, post jobs, find gigs, and connect with talent.',
  alternates: {
    canonical: `${APP_URL}/help`,
  },
  openGraph: {
    title: 'Soundspal Help Center',
    description: 'Find answers to frequently asked questions about Soundspal.',
    url: `${APP_URL}/help`,
  },
}

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is Soundspal?',
        a: 'Soundspal is a platform that connects independent music artists, producers, and singers with venues and organizers. You can find gigs, hire talent, showcase your portfolio, and build your music career all in one place.',
      },
      {
        q: 'Is Soundspal free to use?',
        a: 'Yes, creating an account and browsing talent or job listings is completely free. You can sign up as an artist or as a venue/organizer and start connecting right away.',
      },
      {
        q: 'How do I create a profile?',
        a: "Click 'Sign Up' in the top navigation, choose your account type (Artist or Venue/Organizer), and fill in your profile details. Adding a profile photo, bio, and genres will help others discover you.",
      },
    ],
  },
  {
    category: 'For Artists',
    items: [
      {
        q: 'How do I find gigs and job opportunities?',
        a: "Navigate to the 'Jobs' section to browse current listings. You can filter by type, location, budget, and genre to find opportunities that match your skills.",
      },
      {
        q: 'How do I apply for a job or gig?',
        a: 'Open the job listing and click the Apply button. You may need to complete your profile first, as venues and organizers will review your portfolio and bio.',
      },
      {
        q: 'Can I appear in the Discovery page?',
        a: 'Yes! Completing your profile with genres, a bio, location, and a profile photo significantly increases your visibility on the Discovery page where organizers search for talent.',
      },
    ],
  },
  {
    category: 'For Venues & Organizers',
    items: [
      {
        q: 'How do I post a job or gig listing?',
        a: "After signing in, go to 'Post a Job' from your dashboard. Fill in the details including type, location, budget, required skills, and deadline. Your listing will be reviewed and published.",
      },
      {
        q: 'How do I find and contact artists?',
        a: "Use the 'Discover' page to browse artist profiles. You can filter by role, genre, and location. Send a message directly through the platform to begin a conversation.",
      },
      {
        q: 'Can I feature my listing on the homepage?',
        a: 'Featured listings get more visibility on the Soundspal homepage. Contact us at support@soundspal.com to learn about featuring options.',
      },
    ],
  },
  {
    category: 'Account & Privacy',
    items: [
      {
        q: 'How do I reset my password?',
        a: "Click 'Forgot Password' on the login page and enter your email address. You will receive a reset link within a few minutes.",
      },
      {
        q: 'How do I delete my account?',
        a: 'For account deletion, please contact us at support@soundspal.com with your request. We will process it within 30 days.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[700px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto max-w-[860px] px-4 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Help Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions. Can&apos;t find what you&apos;re looking for?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>

        {/* FAQ sections */}
        <div className="space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-2xl font-bold mb-6 text-foreground">{section.category}</h2>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="group p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all cursor-pointer"
                  >
                    <summary className="flex items-center justify-between gap-4 font-medium list-none select-none">
                      <span>{item.q}</span>
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center p-10 rounded-3xl bg-primary/5 border border-primary/20">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is happy to assist you with any questions or issues.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
