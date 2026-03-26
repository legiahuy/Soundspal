import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Banknote,
  Calendar,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { resolveMediaUrl } from '@/lib/utils'
import type { JobPost } from '@/types/job'

interface JobCardProps {
  job: JobPost
  onApply?: (jobId: string) => void
  onViewDetails?: (jobId: string) => void
  onToggleSave?: (jobId: string) => void
  isSaved?: boolean
  hideFooter?: boolean
}

const JobCard = ({
  job,
  onApply,
  onViewDetails,
  onToggleSave,
  isSaved = false,
  hideFooter = false,
}: JobCardProps) => {
  const router = useRouter()
  const t = useTranslations('JobDetail')

  const tOptions = useTranslations('options')
  const tCommon = useTranslations('Common')

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    let timeAgoStr = ''
    if (diffInMinutes < 60) {
      timeAgoStr = diffInMinutes === 1 ? t('timeAgo.minute', { count: 1 }) : t('timeAgo.minutes', { count: diffInMinutes })
    } else if (diffInHours < 24) {
      timeAgoStr = diffInHours === 1 ? t('timeAgo.hour', { count: 1 }) : t('timeAgo.hours', { count: diffInHours })
    } else if (diffInDays === 0) {
      timeAgoStr = t('today')
    } else if (diffInDays === 1) {
      timeAgoStr = t('yesterday')
    } else if (diffInDays < 7) {
      timeAgoStr = t('timeAgo.days', { count: diffInDays })
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      timeAgoStr = weeks === 1 ? t('timeAgo.week', { count: 1 }) : t('timeAgo.weeks', { count: weeks })
    } else {
      const months = Math.floor(diffInDays / 30)
      timeAgoStr = months === 1 ? t('timeAgo.month', { count: 1 }) : t('timeAgo.months', { count: months })
    }
    return t('updatedOn', { timeAgo: timeAgoStr })
  }

  const formatSalary = () => {
    if (!job.budget_min && !job.budget_max) return t('negotiable')

    const currency = job.budget_currency || 'USD'
    const currencySymbol = currency === 'VND' ? '₫' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '¥'

    // Format numbers with locale-specific formatting (adds commas/periods)
    const formatNumber = (num: number) => {
      return num.toLocaleString('en-US')
    }

    const period = job.payment_type ? ` / ${tOptions(`payment.${job.payment_type}`)}` : ''

    if (job.budget_min && job.budget_max) {
      return `${currencySymbol} ${formatNumber(job.budget_min)} - ${formatNumber(job.budget_max)}${period}`
    } else if (job.budget_min) {
      return `${currencySymbol} ${formatNumber(job.budget_min)}+${period}`
    } else if (job.budget_max) {
      return `${tCommon('upTo')} ${currencySymbol} ${formatNumber(job.budget_max)}${period}`
    }
    return t('negotiable')
  }


  const getLocation = () => {
    const locType = job.location_type ? tOptions(`locationTypes.${job.location_type}`) : null

    if (job.location) {
      return locType ? `${job.location} (${locType})` : job.location
    }
    return locType || t('remote')
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleSave?.(job.id)
  }

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (job.creator_username) {
      router.push(`/profile/${job.creator_username}`)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <button onClick={handleCreatorClick} className="shrink-0 cursor-pointer relative z-10">
            <Avatar className="w-14 h-14 rounded-lg border-2 border-border hover:border-primary transition-colors">
              <AvatarImage src={resolveMediaUrl(job.creator_avatar)} alt={job.creator_display_name || 'Unknown'} />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {(job.creator_display_name || 'Unknown')
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {job.title}
                </h3>
                <button
                  onClick={handleCreatorClick}
                  className="text-left hover:underline"
                >
                  <CardDescription className="font-medium text-base">
                    {job.creator_display_name || 'Unknown'}
                  </CardDescription>
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 relative z-10 hover:bg-background/80"
                onClick={handleSave}
                aria-label={isSaved ? 'Remove from saved' : 'Save job'}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5 text-primary fill-primary" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {/* Job Meta Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {/* <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="truncate">{getJobType()}</span>
          </div> */}
          <div className="flex items-start gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="wrap-break-word">{getLocation()}</span>
          </div>
          <div className="flex items-start gap-1.5 min-w-0">
            <Banknote className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="wrap-break-word">{formatSalary()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{getTimeAgo(job.created_at)}</span>
          </div>
        </div>

        <Separator />

        {/* Genres */}
        {job.genres && job.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.genres.map((genre, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
          {job.brief_description || job.description}
        </p>

        {/* Required Skills Preview */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Required Skills
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              {job.required_skills.slice(0, 2).map((skill, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary shrink-0">•</span>
                  <span className="leading-relaxed">{skill}</span>
                </li>
              ))}
              {job.required_skills.length > 2 && (
                <li className="text-xs text-muted-foreground italic">
                  +{job.required_skills.length - 2} more skill
                  {job.required_skills.length - 2 !== 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>

      {!hideFooter && (
        <CardFooter className="pt-4 gap-2">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onApply?.(job.id)
            }}
            disabled={job.status !== 'published' || job.is_deadline_passed}
          >
            {job.is_deadline_passed ? t('closed') : t('applyNow')}
          </Button>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onViewDetails?.(job.id)
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('viewApplication')}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export default JobCard
