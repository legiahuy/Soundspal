'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { logEvent } from 'firebase/analytics'
import { getFirebaseAnalytics } from '@/lib/firebase'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.jonasaugust12.talent_link' +
  '&utm_source=soundspal_web' +
  '&utm_medium=homepage' +
  '&utm_campaign=app_download'
async function handlePlayStoreClick() {
  const analytics = await getFirebaseAnalytics()
  if (analytics) {
    logEvent(analytics, 'app_download_click', {
      platform: 'android',
      source: 'homepage_download_section',
    })
  }
}

export default function AppDownloadSection() {
  const t = useTranslations('LandingPage.appDownload')

  return (
    /* Same pink/purple glow atmosphere as the About page CTA */
    <section className="relative w-full overflow-hidden bg-background py-12 sm:py-20">
      {/* ── Background glow blobs (mirrors about page) ────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[350px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />

      {/* ── Glass card ────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden border border-border/30 bg-background/60 backdrop-blur-xl shadow-xl shadow-primary/5">
          {/* inner top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            {/* ── Left: CTA content ─────────────────────────────────────── */}
            <div className="flex flex-col gap-6 p-8 sm:p-12">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 w-fit text-xs font-semibold tracking-widest px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {t('badge')}
              </span>

              {/* Heading */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">
                  {t('heading')}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                  {t('subtext')}
                </p>
              </div>

              {/* Store buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Google Play — active, tracked */}
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePlayStoreClick}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border/50 bg-muted/60 hover:bg-muted hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 backdrop-blur-sm transition-all duration-200"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path
                      d="M3.18 23.5c.37.2.8.21 1.2-.02L17.7 16.1l-3.5-3.5L3.18 23.5z"
                      fill="#EA4335"
                    />
                    <path
                      d="M21.5 10.26A1.98 1.98 0 0 0 20.35 8.5L17.7 7.03l-3.87 3.87 3.87 3.87 2.64-1.47c.7-.4 1.06-1.1 1.06-1.04z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M3.18.5C2.79.72 2.5 1.14 2.5 1.7v20.6c0 .56.3.97.68 1.2l11.04-11.04L3.18.5z"
                      fill="#4285F4"
                    />
                    <path
                      d="M14.2 12 3.18.5c.37-.2.83-.18 1.2.02l12.62 7.24-.8.8L14.2 12z"
                      fill="#34A853"
                    />
                  </svg>
                  <div>
                    <p className="text-[10px] text-muted-foreground leading-none uppercase tracking-wider">
                      {t('googlePlay.label')}
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">
                      {t('googlePlay.name')}
                    </p>
                  </div>
                </a>

                {/* App Store — disabled */}
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border/30 bg-muted/30 opacity-40 cursor-not-allowed select-none">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path
                      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                      fill="currentColor"
                    />
                  </svg>
                  <div>
                    <p className="text-[10px] text-muted-foreground leading-none uppercase tracking-wider">
                      {t('appStore.label')}
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">
                      {t('appStore.name')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact QR row */}
              <div className="flex items-center gap-4 pt-4 mt-1 border-t border-border/30">
                <div className="bg-white rounded-xl p-1.5 shrink-0">
                  <Image
                    src="/images/app/qr-code-android.png"
                    alt={t('qr.imageAlt')}
                    width={100}
                    height={100}
                    className="block"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-1">
                    {t('qr.label')}
                  </p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">{t('qr.hint')}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/50 -mt-2">{t('iosNote')}</p>
            </div>

            {/* ── Right: Phone mockup — hidden on mobile, shown on md+ ──── */}
            <div className="relative hidden md:flex items-center justify-center overflow-hidden h-[420px]">
              {/* Glow spot behind the phone */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[140px] bg-primary/30 blur-[60px] rounded-full pointer-events-none" />
              <Image
                src="/images/app/phone-portrait.png"
                alt="Soundspal mobile app"
                width={260}
                height={480}
                className="object-contain drop-shadow-2xl"
                style={{ maxHeight: '390px', width: 'auto' }}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
