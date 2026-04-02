import { Metadata } from 'next'
import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'
const LAST_UPDATED = 'April 1, 2025'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the Soundspal Terms of Service. By using our platform, you agree to these terms governing your use of the Soundspal website and apps.',
  alternates: {
    canonical: `${APP_URL}/terms`,
  },
  openGraph: {
    title: 'Terms of Service - Soundspal',
    description: 'Read the Soundspal Terms of Service.',
    url: `${APP_URL}/terms`,
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[800px] px-4 py-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Soundspal (&quot;the Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) at{' '}
              <Link href="/" className="text-primary hover:underline">
                soundspal.com
              </Link>
              , you agree to be bound by these Terms of Service. If you do not agree to these
              terms, please do not use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>
              Soundspal is an online platform that facilitates connections between music artists,
              producers, singers, venues, and event organizers. We provide tools to create
              profiles, post and discover job opportunities, and communicate within the music
              industry.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">3. User Accounts</h2>
            <p>
              To access certain features of the Platform, you must create an account. You are
              responsible for maintaining the confidentiality of your account credentials and for
              all activities that occur under your account. You agree to provide accurate,
              current, and complete information and to update this information as necessary.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">4. User Conduct</h2>
            <p>You agree not to use the Platform to:</p>
            <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Use the Platform for spam or unsolicited commercial messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">5. Content</h2>
            <p>
              You retain ownership of content you post on the Platform. By posting content, you
              grant Soundspal a non-exclusive, royalty-free license to use, display, and
              distribute your content in connection with operating the Platform. You are solely
              responsible for the content you post and its accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">6. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
              We do not guarantee the accuracy, completeness, or usefulness of any content on
              the Platform. We are not responsible for any agreements, transactions, or disputes
              between users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Soundspal shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the Platform or any content therein.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our sole discretion,
              without notice, for conduct that we believe violates these Terms of Service or is
              harmful to other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">9. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify users of
              significant changes by posting a notice on the Platform. Your continued use of the
              Platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">10. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:support@soundspal.com" className="text-primary hover:underline">
                support@soundspal.com
              </a>{' '}
              or visit our{' '}
              <Link href="/contact" className="text-primary hover:underline">
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            See also our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
