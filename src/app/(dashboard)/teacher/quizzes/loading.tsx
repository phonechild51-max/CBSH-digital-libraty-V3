import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function TeacherQuizzesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText className="h-7 w-40" />
          <SkeletonText className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
