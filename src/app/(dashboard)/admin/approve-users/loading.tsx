import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function ApproveUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonText className="h-7 w-52" />
        <SkeletonText className="h-4 w-80" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}
