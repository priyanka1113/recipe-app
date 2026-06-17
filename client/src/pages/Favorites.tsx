import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { getAllFavorites, removeFavorite, type FavoriteMeal } from "@/features/favorites/db";

type SortMode = "newest" | "name";

export function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  async function loadFavorites() {
    setLoading(true);
    const saved = await getAllFavorites();
    setFavorites(saved);
    setLoading(false);
  }

  useEffect(() => {
    loadFavorites();
    window.addEventListener("favorites-changed", loadFavorites);

    return () => window.removeEventListener("favorites-changed", loadFavorites);
  }, []);

  const visibleFavorites = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    return favorites
      .filter((meal) => {
        if (!normalized) {
          return true;
        }

        return [meal.strMeal, meal.strCategory, meal.strArea].some((value) => value?.toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (sortMode === "name") {
          return a.strMeal.localeCompare(b.strMeal);
        }

        return b.favoritedAt - a.favoritedAt;
      });
  }, [favorites, filter, sortMode]);

  async function handleRemove(meal: FavoriteMeal) {
    await removeFavorite(meal.idMeal);
    window.dispatchEvent(new Event("favorites-changed"));
    toast("Removed from favorites");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Saved for later</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Favorites</h1>
          <p className="mt-2 text-muted-foreground">
            Keep your go-to recipes in one place so they are easy to find, even when you do not have internet.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div>
            <label htmlFor="favorite-filter" className="sr-only">
              Filter favorites
            </label>
            <Input
              id="favorite-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter saved recipes"
            />
          </div>
          <Button
            variant={sortMode === "newest" ? "default" : "outline"}
            onClick={() => setSortMode("newest")}
            aria-pressed={sortMode === "newest"}
          >
            Newest
          </Button>
          <Button
            variant={sortMode === "name" ? "default" : "outline"}
            onClick={() => setSortMode("name")}
            aria-pressed={sortMode === "name"}
          >
            A-Z
          </Button>
        </div>
      </section>

      {loading && (
        <div className="space-y-4" aria-live="polite" aria-busy="true">
          <p className="text-sm font-medium text-muted-foreground">Loading your saved recipes...</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <EmptyState
          title="No favorites saved yet"
          description="Open a recipe and tap Favorite to make it available offline."
          action={
            <Button asChild>
              <Link to="/">Browse recipes</Link>
            </Button>
          }
        />
      )}

      {!loading && favorites.length > 0 && visibleFavorites.length === 0 && (
        <EmptyState title="No saved recipes match" description="Try a different filter or clear the field." />
      )}

      {visibleFavorites.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFavorites.map((meal) => (
            <Card key={meal.idMeal} className="overflow-hidden">
              <Link to={`/meal/${meal.idMeal}`}>
                <img
                  src={meal.strMealThumb}
                  alt={`${meal.strMeal} plated dish`}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
              </Link>
              <CardHeader className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  {meal.strCategory && <Badge variant="secondary">{meal.strCategory}</Badge>}
                  {meal.strArea && <Badge variant="outline">{meal.strArea}</Badge>}
                </div>
                <CardTitle className="line-clamp-2 text-lg">
                  <Link to={`/meal/${meal.idMeal}`} className="hover:text-primary">
                    {meal.strMeal}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-2">
                <p className="line-clamp-3 text-sm text-muted-foreground">{meal.strInstructions}</p>
              </CardContent>
              <CardFooter className="justify-between gap-3 p-4 pt-2">
                <Link to={`/meal/${meal.idMeal}`} className="text-sm font-medium text-primary hover:underline">
                  View saved recipe
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemove(meal)}
                  aria-label={`Remove ${meal.strMeal} from favorites`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
