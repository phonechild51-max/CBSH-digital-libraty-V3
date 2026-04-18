// Reusable skeleton pulse block
export function SkeletonBlock({
  className = '',
  style = {},
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-card)',
        ...style,
      }}
    />
  )
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: 'var(--color-border-card)' }}
    />
  )
}
