import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import authImage from '../../../../public/images/auth/auth-photo-1.jpg'
import RedirectAuthenticatedUser from '@/components/auth/RedirectAuthenticatedUser'

const AuthLayout = ({ children }: { children?: React.ReactNode }) => {
  const t = useTranslations('Auth.layout')
  return (
    <RedirectAuthenticatedUser>
      <div className="min-h-screen">
        <div className="flex h-screen">
          {/* Left side - Fixed background */}
          <div className="bg-muted relative hidden w-1/2 items-center justify-center p-10 lg:flex xl:w-2/5">
            <Image
              src={authImage}
              alt={t('imageAlt')}
              fill
              sizes="99vw"
              loading="eager"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              placeholder="blur"
            />

            {/* Logo in top left */}
            <div className="absolute top-6 left-6 z-20">
              <Link href="/">
                <Image
                  src="/Soundspal.svg"
                  alt={t('logoAlt')}
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            <div className="relative z-10 flex max-h-[800px] max-w-[440px] flex-col justify-center space-y-12 pointer-events-none">
              <div className="space-y-5 text-white">
                <h1 className="text-4xl leading-tight font-bold">{t('title')}</h1>
                <p className="text-lg leading-relaxed opacity-90">{t('description')}</p>
              </div>
            </div>
          </div>

          {/* Right side - Scrollable form */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Mobile header */}
            <div className="p-4 lg:hidden">
              <div className="flex justify-center gap-2">
                <Link href="/">
                  <Image
                    src="/Soundspal.svg"
                    alt={t('logoAlt')}
                    width={120}
                    height={32}
                    className="h-8 w-auto"
                  />
                </Link>
              </div>
            </div>

            {/* Form container */}
            <div className="flex flex-1 items-center justify-center lg:p-10">
              <div className="w-full max-w-sm">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </RedirectAuthenticatedUser>
  )
}

export default AuthLayout
