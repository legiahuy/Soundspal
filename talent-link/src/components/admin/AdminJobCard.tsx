'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Calendar, DollarSign, Eye, FileText, CheckCircle2, Circle } from 'lucide-react'
import type { FeaturedJob } from '@/types/admin'
import { cn } from '@/lib/utils'

interface AdminJobCardProps {
  job: FeaturedJob
  onFeatureToggle?: (jobId: string, isFeatured: boolean) => void
  isLoading?: boolean
  selectable?: boolean
  selected?: boolean
  onSelect?: (jobId: string) => void
}

const formatCurrency = (amount: number, currency: string) => {
  if (currency === 'VND') {
    return `${(amount / 1000000).toFixed(1)}M VND`
  }
  return `${amount} ${currency}`
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateString
  }
}

export function AdminJobCard({
  job,
  onFeatureToggle,
  isLoading,
  selectable,
  selected,
  onSelect,
}: AdminJobCardProps) {
  return (
    <Card
      className={cn(
        'group relative border-border/50 bg-card/70 backdrop-blur-sm transition-all duration-300 flex flex-col hover:shadow-lg h-full',
        selectable
          ? 'cursor-pointer hover:border-primary/50'
          : 'hover:-translate-y-1 hover:border-primary/30',
        selected && 'border-primary bg-primary/5 shadow-md',
      )}
      onClick={() => selectable && onSelect && onSelect(job.id)}
    >
      <CardContent className="p-5 flex flex-col h-full gap-3">
        {/* Selection Indicator */}
        {selectable && (
          <div className="absolute top-4 right-4 z-10">
            {selected ? (
              <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground/30" />
            )}
          </div>
        )}

        {/* Job Title & Type */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {job.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize border-primary/30 text-primary">
              {job.post_type?.replace('_', ' ') || 'Unknown'}
            </Badge>
            {job.type && (
              <Badge variant="secondary" className="capitalize">
                {job.type}
              </Badge>
            )}
            <Badge
              variant={job.status === 'published' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {job.status}
            </Badge>
          </div>
        </div>

        {/* Brief Description */}
        {job.brief_description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.brief_description}</p>
        )}

        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-muted-foreground">By:</span>
          <span className="font-medium truncate">
            {job.creator_display_name || job.creator_username || 'Unknown'}
          </span>
        </div>

        {/* Budget */}
        {(job.budget_min || job.budget_max) && job.budget_currency && (
          <div className="flex items-center gap-2 text-sm mb-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {job.budget_min && job.budget_max
                ? `${formatCurrency(job.budget_min, job.budget_currency)} - ${formatCurrency(job.budget_max, job.budget_currency)}`
                : job.budget_min
                  ? `From ${formatCurrency(job.budget_min, job.budget_currency)}`
                  : `Up to ${formatCurrency(job.budget_max!, job.budget_currency)}`}
            </span>
          </div>
        )}

        {/* Location */}
        {job.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{job.location}</span>
            {job.location_type && (
              <Badge variant="outline" className="text-xs capitalize">
                {job.location_type}
              </Badge>
            )}
          </div>
        )}

        {/* Deadline */}
        {job.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="w-4 h-4" />
            <span>Deadline: {formatDate(job.deadline)}</span>
          </div>
        )}

        {/* Genres */}
        {job.genres && job.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {job.genres.slice(0, 3).map((genre, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
            {job.genres.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{job.genres.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 p-2 rounded-lg bg-muted/30">
          {job.total_submissions !== undefined && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{job.total_submissions} submissions</span>
            </div>
          )}
          {job.views_count !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{job.views_count} views</span>
            </div>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="grow" />

        {/* Action Button */}
        {/* Action Button - Only show if not selectable */}
        {!selectable && onFeatureToggle && (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onFeatureToggle(job.id, job.is_featured)
            }}
            disabled={isLoading}
            variant={job.is_featured ? 'outline' : 'default'}
            className="w-full group-hover:shadow-md transition-all"
            size="sm"
          >
            {isLoading ? 'Processing...' : job.is_featured ? 'Unfeature' : 'Feature'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
