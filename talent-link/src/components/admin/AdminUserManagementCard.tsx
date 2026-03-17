'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, CheckCircle2, Mail, Calendar } from 'lucide-react'
import type { AdminUser } from '@/types/admin'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/utils'

interface AdminUserManagementCardProps {
  user: AdminUser
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600 border-red-500/30',
  producer: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  singer: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  venue: 'bg-green-500/10 text-green-600 border-green-500/30',
}

export function AdminUserManagementCard({ user }: AdminUserManagementCardProps) {
  const avatarUrl = user.avatar_url ? resolveMediaUrl(user.avatar_url) : undefined

  return (
    <Link href={`/admin/users/${user.id}`}>
      <Card
        className={cn(
          'group relative border-border/50 bg-card/70 backdrop-blur-sm transition-all duration-300 flex flex-col hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 min-h-[240px] h-full cursor-pointer',
          user.status === 'banned' && 'opacity-60 border-destructive/30',
        )}
      >
        <CardContent className="p-4 flex flex-col h-full gap-3">
          {/* Status indicators */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {user.is_verified && (
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            )}
            {user.status?.toLowerCase() === 'banned' && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                Banned
              </Badge>
            )}
          </div>

          {/* User Avatar & Info */}
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-linear-to-br from-primary/20 to-primary/10 shrink-0 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
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
            <Badge
              variant="outline"
              className={cn('capitalize', roleColors[user.role] || 'border-primary/30 text-primary')}
            >
              {user.role}
            </Badge>
          </div>

          {/* Email */}
          {user.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}

          {/* Location */}
          {(user.city || user.country) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {[user.city, user.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Genres */}
          {user.genres && user.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
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

          {/* Spacer */}
          <div className="grow" />

          {/* Created Date */}
          {user.created_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border/30">
              <Calendar className="w-3 h-3" />
              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
