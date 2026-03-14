'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, CheckCircle2, Circle, ImageIcon } from 'lucide-react'
import type { FeaturedUser } from '@/types/admin'
import { cn } from '@/lib/utils'

interface AdminUserCardProps {
  user: FeaturedUser
  onFeatureToggle?: (userId: string, isFeatured: boolean) => void
  onManageMedia?: (user: FeaturedUser) => void
  isLoading?: boolean
  selectable?: boolean
  selected?: boolean
  onSelect?: (userId: string) => void
}

export function AdminUserCard({ user, onFeatureToggle, onManageMedia, isLoading, selectable, selected, onSelect }: AdminUserCardProps) {
  return (
    <Card 
      className={cn(
        "group relative border-border/50 bg-card/70 backdrop-blur-sm transition-all duration-300 flex flex-col hover:shadow-lg min-h-[240px] h-full",
        selectable ? "cursor-pointer hover:border-primary/50" : "hover:-translate-y-1 hover:border-primary/30",
        selected && "border-primary bg-primary/5 shadow-md"
      )}
      onClick={() => selectable && onSelect && onSelect(user.id)}
    >
      <CardContent className="p-4 flex flex-col h-full gap-3">
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

        {/* User Avatar & Info */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.display_name || user.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary">
                {(user.display_name || user.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="w-full">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors mb-0.5">
              {user.display_name || user.username}
            </h3>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex justify-center mb-2">
          <Badge variant="outline" className="capitalize border-primary/30 text-primary">
            {user.role}
          </Badge>
        </div>

        {/* Bio */}
        {user.brief_bio && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {user.brief_bio}
          </p>
        )}

        {/* Genres */}
        {user.genres && user.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {user.genres.slice(0, 3).map((genre) => (
              <Badge key={genre.id} variant="secondary" className="text-xs px-2 py-0">
                {genre.name}
              </Badge>
            ))}
            {user.genres.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                +{user.genres.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Location */}
        {(user.city || user.country) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">
              {[user.city, user.country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow" />

        {/* Action Button */}
        {/* Action Button - Only show if not selectable */}
        {!selectable && (
          <div className="flex gap-2">
            {onManageMedia && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onManageMedia(user)
                }}
                variant="outline"
                className="flex-1 gap-1.5 group-hover:shadow-md transition-all"
                size="sm"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Media
              </Button>
            )}
            {onFeatureToggle && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onFeatureToggle(user.id, user.is_featured)
                }}
                disabled={isLoading}
                variant={user.is_featured ? 'outline' : 'default'}
                className={cn(onManageMedia ? 'flex-1' : 'w-full', 'group-hover:shadow-md transition-all')}
                size="sm"
              >
                {isLoading ? 'Processing...' : user.is_featured ? 'Unfeature' : 'Feature'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
