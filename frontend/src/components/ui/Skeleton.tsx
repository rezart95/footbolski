import { cn } from "../../lib/utils";

/** A single placeholder block: flat ink at low opacity, square like the rest. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-fg/10", className)} />;
}

/** Placeholder shaped like an EventCard, shown while events load. */
export function EventCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="border-b-2 border-fg/15 py-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className={cn("mt-2", large ? "h-10 w-48" : "h-7 w-36")} />
      <Skeleton className="mt-2 h-4 w-40" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

export function EventCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Placeholder shaped like the match sheet: day heading, strip, list rows. */
export function MatchSheetSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading the match">
      <div>
        <Skeleton className="h-14 w-56" />
        <Skeleton className="mt-3 h-5 w-44" />
        <Skeleton className="mt-2 h-5 w-52" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton className="h-10 w-full" key={i} />
        ))}
      </div>
    </div>
  );
}

/** Placeholder grid shaped like the player cards. */
export function PlayerGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="border-2 border-fg/15" key={i}>
          <Skeleton className="h-36 w-full" />
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
