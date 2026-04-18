import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function StudentMaterialsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonText className="h-7 w-48" />
        <SkeletonText className="h-4 w-72" />
      </div>
      {/* Search + filter row */}
      <div className="flex gap-3 flex-wrap">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-40" />
        <SkeletonBlock className="h-10 w-40" />
      </div>
      {/* Materials grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-52" />
        ))}
      </div>
    </div>
  )
}
