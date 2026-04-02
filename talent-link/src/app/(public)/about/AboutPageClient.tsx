'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight, Globe2, Lightbulb, ShieldCheck, Users2 } from 'lucide-react'

const AboutPageClient = () => {
  const t = useTranslations('AboutPage')

  // Animation variants
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  const staggerContainer: Variants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const valuesList = [
    { key: 'community', icon: Users2 },
    { key: 'transparency', icon: ShieldCheck },
    { key: 'innovation', icon: Lightbulb },
    { key: 'empowerment', icon: Globe2 },
  ]

  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-primary/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 blur-[100px] rounded-full" />
      </div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          className="mx-auto relative z-10 px-4 py-20 text-center max-w-4xl"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.h1
            className="from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block max-w-[920px] bg-linear-to-r bg-clip-text text-4xl font-semibold text-balance text-transparent drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-6xl lg:text-7xl lg:leading-tight"
            variants={fadeInUp}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            className="text-muted-foreground relative z-10 font-medium text-balance mt-6 text-lg sm:text-xl md:mt-10"
            variants={fadeInUp}
          >
            {t('hero.subtitle')}
          </motion.p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background relative z-10">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="relative aspect-square md:aspect-4/3 rounded-3xl overflow-hidden border border-border/10 shadow-2xl">
              <Image
                src="/images/about/our-mission.webp"
                alt="Our Mission"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('mission.title')}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('mission.description')}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 relative overflow-hidden bg-muted/20">
        <motion.div
          className="container mx-auto px-4 max-w-[1200px]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('values.title')}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('values.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuesList.map((value) => (
              <motion.div
                key={value.key}
                variants={fadeInUp}
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t(`values.${value.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`values.${value.key}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border/10 bg-background relative z-10">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'stats.artists', value: '2k+' },
              { label: 'stats.venues', value: '500+' },
              { label: 'stats.gigs', value: '10k+' },
              { label: 'stats.satisfaction', value: '98%' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{t(stat.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <motion.div
          className="container mx-auto px-4 relative z-10 text-center max-w-2xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold mb-6">
            {t('cta.title')}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-muted-foreground mb-8">
            {t('cta.subtitle')}
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                {t('cta.button')} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </>
  )
}

export default AboutPageClient
