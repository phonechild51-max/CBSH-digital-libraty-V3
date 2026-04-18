import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function AdminMaterialsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText className="h-7 w-40" />
          <SkeletonText className="h-4 w-64" />
        </div>
      </div>
      {/* Filter bar */}
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-40" />
      </div>
      {/* Materials grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}
