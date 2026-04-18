import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function StudentQuizzesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonText className="h-7 w-44" />
        <SkeletonText className="h-4 w-64" />
      </div>
      {/* Tab bar */}
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-40" />
        <SkeletonBlock className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}
