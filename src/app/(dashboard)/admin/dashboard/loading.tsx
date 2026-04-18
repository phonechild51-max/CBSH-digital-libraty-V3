import { SkeletonBlock, SkeletonText } from '@/components/ui/skeleton-helpers'

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText className="h-7 w-48" />
        <SkeletonText className="h-4 w-72" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>

      {/* Pending Approvals */}
      <SkeletonBlock className="h-64" />
    </div>
  )
}
