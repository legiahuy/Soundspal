import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Check } from 'lucide-react'
import { adminService } from '@/services/adminService'
import { searchService } from '@/services/searchService'
import { AdminJobCard } from './AdminJobCard'
// We might need to map between search result and FeaturedJob, as the types might slightly differ.
// Assuming FeaturedJob is compatible or we cast it for now.
import type { FeaturedJob } from '@/types/admin'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchJobsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobFeatured: () => void
}

// Helper to map search result to AdminJobCard prop type if needed
const mapSearchResultToFeaturedJob = (job: Record<string, unknown>): FeaturedJob => {
  return {
    id: job.id,
    title: job.title,
    post_type: job.post_type || job.postType,
    status: job.status,
    visibility: job.visibility,
    creator_id: job.creator_id || job.creatorId,
    creator_role: job.creator_role || job.creatorRole,
    creator_username: job.creator_username || job.creatorUsername,
    creator_display_name: job.creator_display_name || job.creatorDisplayName || job.creator_name,
    creator_avatar_url: job.creator_avatar_url || job.creatorAvatarUrl || job.creator_avatar,
    created_at: job.created_at || job.createdAt,
    updated_at: job.updated_at || job.updatedAt,
    is_featured: job.is_featured || false,
    location: job.location,
    location_type: job.location_type || job.locationType,
    brief_description: job.brief_description || job.description, 
    genres: job.genres,
    budget_min: job.budget_min || job.budgetMin,
    budget_max: job.budget_max || job.budgetMax,
    budget_currency: job.budget_currency || job.budgetCurrency as 'VND' | 'USD',
    views_count: job.views_count || job.viewsCount,
    total_submissions: job.total_submissions || job.applications_count || job.applicationsCount,
    deadline: job.deadline,
    type: job.type,
  } as unknown as FeaturedJob
}

export function SearchJobsDialog({ open, onOpenChange, onJobFeatured }: SearchJobsDialogProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<FeaturedJob[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [featuring, setFeaturing] = useState(false)

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        setSearching(false)
        setIsTyping(false)
        return
      }

      setSearching(true)
      setIsTyping(false)
      try {
        const response = await searchService.searchJobs({
          query: debouncedQuery,
          page: 1,
          pageSize: 50,
        })
        
        const mappedJobs = response.jobPosts.map(j => mapSearchResultToFeaturedJob(j as unknown as Record<string, unknown>))
        setResults(mappedJobs)
      } catch (error) {
        console.error('Search failed:', error)
        toast.error('Failed to search jobs')
      } finally {
        setSearching(false)
      }
    }

    search()
  }, [debouncedQuery])

  // Clear state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedIds(new Set())
      setSearching(false)
      setIsTyping(false)
    }
  }, [open])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      setIsTyping(true)
    } else {
      setIsTyping(false)
      setSearching(false)
    }
  }

  const handleSelect = (jobId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedIds(newSelected)
  }

  const handleFeatureSelected = async () => {
    if (selectedIds.size === 0) return

    setFeaturing(true)
    let successCount = 0
    let failCount = 0

    try {
      // Process features in parallel or sequence. Parallel for speed.
      // Note: If API had bulk feature endpoint, we'd use that.
      const promises = Array.from(selectedIds).map(id => 
        adminService.featureJob(id)
          .then(() => { successCount++ })
          .catch(() => { failCount++ })
      )

      await Promise.all(promises)

      if (successCount > 0) {
        toast.success(`Successfully featured ${successCount} jobs`)
        onJobFeatured()
        onOpenChange(false)
      }
      
      if (failCount > 0) {
        toast.error(`Failed to feature ${failCount} jobs`)
      }

    } catch (error) {
      console.error('Failed to feature jobs:', error)
      toast.error('An error occurred while featuring jobs')
    } finally {
      setFeaturing(false)
    }
  }

  // Remove unused staggerContainer

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw]! w-full h-[90vh] overflow-hidden flex flex-col border-border/50 bg-card/95 backdrop-blur-md p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b border-border/50">
          <DialogTitle className="text-2xl">Search Jobs to Feature</DialogTitle>
        </DialogHeader>

        {/* Search Input Area */}
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
              placeholder="Search by job title, description, or creator..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10 h-12 text-lg bg-background border-border/50 focus-visible:ring-primary/20"
              autoFocus
            />
            {(searching || isTyping) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
          {searching && results.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Searching for jobs...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                {query.trim() ? 'No jobs found' : 'Start searching'}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {query.trim() 
                  ? `We couldn't find any jobs matching "${query}"` 
                  : 'Enter keywords like job title, type, or creator name to find jobs to feature.'}
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6 auto-rows-fr transition-opacity duration-200 ${searching ? 'opacity-50' : 'opacity-100'}`}
            >
              {results.map((job) => (
                <motion.div 
                  key={job.id} 
                  variants={fadeInUp}
                  initial="hidden"
                  animate="show"
                  className="h-full"
                >
                  <AdminJobCard
                    job={job}
                    selectable={true}
                    selected={selectedIds.has(job.id)}
                    onSelect={handleSelect}
                    isLoading={featuring}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="p-4 border-t border-border/50 bg-background flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedIds.size} job{selectedIds.size !== 1 && 's'} selected
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFeatureSelected} 
              disabled={selectedIds.size === 0 || featuring}
              className="gap-2 min-w-[140px]"
            >
              {featuring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Feature Selected
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
