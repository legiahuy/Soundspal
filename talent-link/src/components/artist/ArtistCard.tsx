import Link from 'next/link'
import Image, { StaticImageData } from 'next/image'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

interface ArtistCardProps {
  id: string
  name: string
  username: string
  image: string | StaticImageData
  genres: string[]
  location: string
  description?: string
  roleLabel?: string
}

const ArtistCard = ({ name, username, image, genres, location, description, roleLabel }: ArtistCardProps) => {
  const displayGenres = genres.slice(0, 2)
  const remainingCount = genres.length - 2

  return (
    <Link href={`/profile/${username}`} className="group block h-full">
      <motion.div
        className="relative overflow-hidden rounded-xl bg-card border border-border/40  mx-3 h-full flex flex-col"
        whileHover={{
          y: -5,
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
          borderColor: 'var(--primary)',
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative aspect-square overflow-hidden shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        <div className="p-4 space-y-3 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
            {roleLabel && (
              <Badge variant="outline" className="text-[11px] px-2 py-0.5 whitespace-nowrap">
                {roleLabel}
              </Badge>
            )}
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {displayGenres.map((genre) => (
                <Badge key={genre} className="bg-primary">
                  {genre}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge className="bg-muted text-muted-foreground">
                  +{remainingCount}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{description}</p>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

export default ArtistCard
