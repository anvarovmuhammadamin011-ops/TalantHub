export function Skeleton({ className = "" }) {
  return <div className={`animate-skeleton bg-surface rounded-md ${className}`} />;
}

export function VacancyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-11 h-11 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VacancyCardSkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <VacancyCardSkeleton key={i} />)}
    </div>
  );
}
