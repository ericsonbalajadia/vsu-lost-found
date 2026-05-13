// src/components/ui/SkeletonLoader.tsx
export function ItemCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-surface-container-high" />
      <div className="p-6 space-y-4">
        <div className="h-4 bg-surface-container-high rounded w-1/4" />
        <div className="h-6 bg-surface-container-high rounded w-3/4" />
        <div className="h-4 bg-surface-container-high rounded w-full" />
        <div className="h-4 bg-surface-container-high rounded w-2/3" />
        <div className="h-10 bg-surface-container-high rounded-xl mt-4" />
      </div>
    </div>
  )
}

export function ItemGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}