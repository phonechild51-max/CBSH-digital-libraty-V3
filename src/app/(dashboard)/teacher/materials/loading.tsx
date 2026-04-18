import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function TeacherMaterialsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText className="h-7 w-44" />
          <SkeletonText className="h-4 w-68" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}
