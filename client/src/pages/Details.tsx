import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, PlayCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { FavoriteButton } from "@/components/favorite-button";
import { RecipeReader } from "@/components/recipe-reader";
import { UnitPreferenceToggle } from "@/components/unit-preference-toggle";
import { useUnitPreference } from "@/components/unit-preference-provider";
import { getFavorite } from "@/features/favorites/db";
import { getIngredients, getMeal } from "@/lib/api";
import { convertMeasure } from "@/lib/unitConversion";

export function Details() {
  const { id } = useParams<{ id: string }>();
  const { unitPreference } = useUnitPreference();

  const mealQuery = useQuery({
    queryKey: ["meal", id],
    queryFn: async ({ signal }) => {
      try {
        return await getMeal(id ?? "", signal);
      } catch (error) {
        const favorite = id ? await getFavorite(id) : undefined;
        if (favorite) {
          return favorite;
        }

        throw error;
      }
    },
    enabled: Boolean(id),
  });

  if (mealQuery.isLoading) {
    return <DetailsSkeleton />;
  }

  if (mealQuery.isError || !mealQuery.data) {
    return (
      <EmptyState
        title={navigator.onLine ? "Recipe not found" : "Recipe is not cached"}
        description={
          navigator.onLine
            ? "The recipe may have moved or the service may be unavailable."
            : "Saved favorites remain available offline. Reconnect to load this recipe."
        }
        action={
          <Button asChild variant="outline">
            <Link to="/favorites">Open favorites</Link>
          </Button>
        }
      />
    );
  }

  const meal = mealQuery.data;
  const ingredients = getIngredients(meal);
  const displayIngredients = ingredients.map(({ ingredient, measure }) => ({
    ingredient,
    measure: convertMeasure(measure, unitPreference),
  }));
  const tags = meal.strTags?.split(",").filter(Boolean) ?? [];

  return (
    <article className="space-y-6">
      <Button asChild variant="ghost">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to browse
        </Link>
      </Button>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <img
          src={meal.strMealThumb}
          alt={`${meal.strMeal} plated dish`}
          className="aspect-square w-full rounded-3xl object-cover shadow-sm"
        />
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {meal.strCategory && <Badge variant="secondary">{meal.strCategory}</Badge>}
            {meal.strArea && <Badge variant="outline">{meal.strArea}</Badge>}
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{meal.strMeal}</h1>
            <p className="mt-3 text-muted-foreground">
              Save this recipe to keep full ingredients and instructions available offline.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <FavoriteButton meal={meal} variant="default" />
            {meal.strYoutube && (
              <Button asChild variant="outline">
                <a href={meal.strYoutube} target="_blank" rel="noreferrer">
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Watch video
                </a>
              </Button>
            )}
            {meal.strSource && (
              <Button asChild variant="outline">
                <a href={meal.strSource} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Source
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <RecipeReader
        title={meal.strMeal}
        ingredients={displayIngredients.map(({ ingredient, measure }) => ({
          ingredient,
          measure: measure.display,
        }))}
        instructions={meal.strInstructions}
      />

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Ingredients</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">Measurements are approximate when converted.</p>
            </div>
            <UnitPreferenceToggle />
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {displayIngredients.map(({ ingredient, measure }) => (
                <li key={ingredient} className="flex justify-between gap-4 border-b pb-2 text-sm last:border-0">
                  <span className="font-medium">{ingredient}</span>
                  <span className="text-right text-muted-foreground">
                    {measure.display}
                    {measure.wasConverted && <span className="block text-xs">Original: {measure.original}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 leading-7 text-muted-foreground">
              {meal.strInstructions
                .split(/\r?\n/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <p className="text-sm font-medium text-muted-foreground">Loading recipe details...</p>
      <Skeleton className="h-10 w-32" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    </div>
  );
}
