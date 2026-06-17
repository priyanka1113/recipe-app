import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingGrid() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <p className="text-sm font-medium text-muted-foreground">Finding recipes for you...</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <CardHeader className="space-y-3 p-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-4/5" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
