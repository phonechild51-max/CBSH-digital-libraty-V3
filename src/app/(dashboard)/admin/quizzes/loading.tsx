import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function AdminQuizzesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonText className="h-7 w-40" />
        <SkeletonText className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}
