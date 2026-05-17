// src/components/ui/SkeletonLoader.tsx
/* eslint-disable react-refresh/only-export-components */
export function ItemCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden animate-pulse w-full">
      <div className="h-48 bg-surface-container-high" />
      <div className="p-6 space-y-4">
        <div className="h-4 bg-surface-container-high rounded w-1/4" />
        <div className="h-6 bg-surface-container-high rounded w-3/4" />
        <div className="h-4 bg-surface-container-high rounded w-full" />
        <div className="h-4 bg-surface-container-high rounded w-2/3" />
        <div className="h-10 bg-surface-container-high rounded-xl mt-4" />
      </div>
    </div>
  );
}

// Returns an array of skeleton cards (not wrapped in a grid)
export function getSkeletonCards(count = 6) {
  return Array.from({ length: count }).map((_, i) => (
    <ItemCardSkeleton key={i} />
  ));
}