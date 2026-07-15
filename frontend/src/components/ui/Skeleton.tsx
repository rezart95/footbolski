import { cn } from "../../lib/utils";

/** A single shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

/** Placeholder shaped like an EventCard, shown while events load. */
export function EventCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-pitch-900/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className={large ? "h-9 w-44" : "h-6 w-32"} />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <Skeleton className="mt-6 h-14 w-full rounded-lg" />
      <Skeleton className="mt-3 h-9 w-full rounded-lg" />
    </div>
  );
}

export function EventCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Placeholder grid shaped like the player cards. */
export function PlayerGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="surface overflow-hidden rounded-xl" key={i}>
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
