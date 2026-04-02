import { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase, Code2, Megaphone, Music2 } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join the Soundspal team. We are building the future of music talent discovery. Explore career opportunities and help artists and venues connect.',
  alternates: {
    canonical: `${APP_URL}/careers`,
  },
  openGraph: {
    title: 'Careers at Soundspal',
    description: 'Join the Soundspal team and help artists and venues connect.',
    url: `${APP_URL}/careers`,
  },
}

const openRoles = [
  {
    title: 'Full-Stack Engineer',
    team: 'Engineering',
    type: 'Full-time · Remote',
    icon: Code2,
  },
  {
    title: 'Growth & Marketing Lead',
    team: 'Marketing',
    type: 'Full-time · Ho Chi Minh City',
    icon: Megaphone,
  },
  {
    title: 'Music Industry Partnerships',
    team: 'Business Development',
    type: 'Full-time · Flexible',
    icon: Music2,
  },
  {
    title: 'Product Designer',
    team: 'Design',
    type: 'Part-time · Remote',
    icon: Briefcase,
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-primary/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-primary/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto max-w-[1200px] px-4 py-24">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Work at Soundspal
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            We are a passionate team on a mission to revolutionize how music talent connects with
            opportunities. Join us and make an impact.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              title: 'Impact-Driven',
              description: 'Every line of code, every campaign, every partnership directly helps real artists build their careers.',
            },
            {
              title: 'Remote-Friendly',
              description: 'We believe great work happens anywhere. We hire talent regardless of location.',
            },
            {
              title: 'Fast & Ambitious',
              description: 'We move quickly, learn constantly, and are not afraid to try bold ideas.',
            },
          ].map((v) => (
            <div
              key={v.title}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all"
            >
              <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>

        {/* Open Roles */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8">Open Positions</h2>
          <div className="space-y-4">
            {openRoles.map((role) => (
              <div
                key={role.title}
                className="flex items-center gap-6 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <role.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{role.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {role.team} · {role.type}
                  </div>
                </div>
                <a
                  href="mailto:careers@soundspal.com"
                  className="text-sm font-medium text-primary hover:underline shrink-0"
                >
                  Apply →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-primary/5 border border-primary/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Don&apos;t see a role that fits?
          </h2>
          <p className="text-muted-foreground mb-6">
            We are always looking for talented people. Send us your CV and tell us how you can
            contribute.
          </p>
          <a
            href="mailto:careers@soundspal.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Get in touch
          </a>
          <p className="mt-6 text-sm text-muted-foreground">
            Or{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>{' '}
            for any other inquiries.
          </p>
        </div>
      </div>
    </div>
  )
}
