import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonText className="h-8 w-64" />
        <SkeletonText className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-64" />
      </div>
    </div>
  )
}
