'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { startGoogleOAuth } from '@/lib/oauth'

type LogInFormValues = {
  identifier: string
  password: string
}

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  const t = useTranslations('Auth.login')
  const router = useRouter()

  const loginSchema = z.object({
    identifier: z.string().min(1, t('emailInvalid')),
    password: z.string().min(6, t('passwordMinLength')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LogInFormValues>({ resolver: zodResolver(loginSchema) })
  const { login } = useAuthStore()
  const onSubmit = async (data: LogInFormValues) => {
    const { identifier, password } = data
    await login(identifier, password)
    const currentUser = useAuthStore.getState().user
    const normalizedRole = currentUser?.role?.toLowerCase()

    if (normalizedRole === 'admin') {
      router.replace('/admin')
      return
    }

    router.replace(currentUser?.username ? `/profile/${currentUser.username}` : '/')
    // try {
    //   await login(identifier, password)
    //   navigate('/users/dashboard')
    // } catch {
    //   //STAY ON PAGE
    // }
  }
  return (
    <form
      className={cn('flex flex-col gap-3', className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col gap-5">
        <div className="mb-3 flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm text-balance">{t('subtitle')}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="identifier" className="block text-sm">
            {t('email')}
          </Label>
          <Input
            type="text"
            id="identifier"
            placeholder={t('emailPlaceholder')}
            {...register('identifier')}
          />
          {errors.identifier && (
            <p className="text-destructive text-xs">{errors.identifier.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex">
            <Label htmlFor="password" className="text-sm block">
              {t('password')}
            </Label>
            <Link
              href="/auth/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline "
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              className="pr-10"
              {...register('password')}
            />
          </div>
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>
        <Button
          variant="default"
          type="submit"
          className="w-full hover:cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>

        <FieldSeparator>{t('continueWith')}</FieldSeparator>

        <Button
          variant="outline"
          type="button"
          className="w-full hover:cursor-pointer"
          onClick={() => {
            void startGoogleOAuth()
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z" />
          </svg>
          {t('signInWithGoogle')}
        </Button>
        <div className="text-center text-sm">
          {t('noAccount')}{' '}
          <Link href="/auth/signup" className="underline underline-offset-4">
            {t('signUp')}
          </Link>
        </div>
      </div>
    </form>
  )
}
