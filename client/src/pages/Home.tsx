import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { LoadingGrid } from "@/components/loading-grid";
import { MealCard } from "@/components/meal-card";
import { getCategories, getMeal, getMealsByCategory, searchMeals } from "@/lib/api";

const MEAL_TYPES = [
  { label: "Breakfast", category: "Breakfast" },
  { label: "Lunch", category: "Vegetarian" },
  { label: "Dinner", category: "Pasta" },
  { label: "Snack", category: "Starter" },
  { label: "Dessert", category: "Dessert" },
];
const MAIN_CATEGORY_NAMES = new Set(MEAL_TYPES.map((mealType) => mealType.category));
type SelectionSource = "quick-pick" | "subcategory";

export function Home() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const [selectedCategory, setSelectedCategory] = useState("Dessert");
  const [selectionSource, setSelectionSource] = useState<SelectionSource>("quick-pick");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => getCategories(signal),
  });

  const mealsQuery = useQuery({
    queryKey: query ? ["search", query] : ["category", selectedCategory],
    queryFn: ({ signal }) => (query ? searchMeals(query, signal) : getMealsByCategory(selectedCategory, signal)),
  });

  const selectedCategoryData = useMemo(
    () => categoriesQuery.data?.find((category) => category.strCategory === selectedCategory),
    [categoriesQuery.data, selectedCategory],
  );
  const activeMealType =
    selectionSource === "quick-pick" ? MEAL_TYPES.find((mealType) => mealType.category === selectedCategory) : undefined;
  const selectedLabel = activeMealType?.label ?? selectedCategory;

  const orderedCategories = useMemo(() => {
    if (!categoriesQuery.data) {
      return [];
    }

    const miscellaneous = categoriesQuery.data.find((category) => category.strCategory === "Miscellaneous");
    const remainingCategories = categoriesQuery.data.filter(
      (category) => !MAIN_CATEGORY_NAMES.has(category.strCategory) && category.strCategory !== "Miscellaneous",
    );
    const ordered = [...remainingCategories];

    if (miscellaneous) {
      ordered.push(miscellaneous);
    }

    return ordered;
  }, [categoriesQuery.data]);

  const visibleSubcategories = orderedCategories;

  function selectQuickPick(category: string) {
    setSelectionSource("quick-pick");
    setSelectedCategory(category);
  }

  function selectSubcategory(category: string) {
    setSelectionSource("subcategory");
    setSelectedCategory(category);
  }

  useEffect(() => {
    if (!mealsQuery.data?.length || !navigator.onLine) {
      return;
    }

    const prefetchVisibleRecipeDetails = () => {
      mealsQuery.data.slice(0, 12).forEach((meal) => {
        // Warm the detail API cache so recipe card links have a useful offline fallback.
        queryClient
          .prefetchQuery({
            queryKey: ["meal", meal.idMeal],
            queryFn: ({ signal }) => getMeal(meal.idMeal, signal),
            staleTime: 1000 * 60 * 60,
          })
          .catch(() => {
            // Prefetching is best-effort and should never block browsing.
          });
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchVisibleRecipeDetails, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchVisibleRecipeDetails, 500);
    return () => globalThis.clearTimeout(timeoutId);
  }, [mealsQuery.data, queryClient]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-lime-100 to-stone-50 p-6 text-slate-950 shadow-sm dark:from-slate-900 dark:to-slate-800 dark:text-white md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Recipe finder</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Find a meal, save it, cook it anywhere.</h1>
        <p className="mt-4 max-w-2xl text-base text-slate-700 dark:text-slate-300">
          Search easy meal ideas, explore new cuisines, and save favorites so your go-to recipes are ready when you are.
        </p>
      </section>

      <section aria-labelledby="categories-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="categories-heading" className="text-2xl font-semibold">
              {query ? `Search results for "${query}"` : "Browse categories"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {query ? "Clear the search field to return to categories." : `Showing ${selectedLabel} recipes.`}
            </p>
          </div>
          {!query && selectedCategoryData && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Info className="h-4 w-4" aria-hidden="true" />
                  About {selectedCategory}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedCategory}</DialogTitle>
                  <DialogDescription>{selectedCategoryData.strCategoryDescription}</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!query && (
          <div className="space-y-3 rounded-2xl border bg-card p-4">
            <div>
              <h3 className="font-semibold">Quick picks</h3>
              <p className="text-sm text-muted-foreground">Start with a common craving, then browse more categories below.</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Main meal types">
              {MEAL_TYPES.map((mealType) => (
                <Button
                  key={mealType.label}
                  variant={activeMealType?.label === mealType.label ? "default" : "outline"}
                  onClick={() => selectQuickPick(mealType.category)}
                  aria-pressed={activeMealType?.label === mealType.label}
                >
                  {mealType.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!query && (
          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Recipe categories">
            {categoriesQuery.isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-muted" />
                ))
              : visibleSubcategories.map((category) => (
                  <Button
                    key={category.idCategory}
                    variant={selectedCategory === category.strCategory ? "default" : "outline"}
                    onClick={() => selectSubcategory(category.strCategory)}
                    aria-pressed={selectedCategory === category.strCategory}
                    className="shrink-0"
                  >
                    {category.strCategory}
                  </Button>
                ))}
          </div>
        )}
      </section>

      <section aria-live="polite">
        {mealsQuery.isLoading && <LoadingGrid />}
        {mealsQuery.isError && (
          <EmptyState
            title={navigator.onLine ? "Recipes could not load" : "You are offline"}
            description={
              navigator.onLine
                ? "The recipe service is unavailable. Try again in a moment."
                : "Open Favorites to view recipes saved locally, or reconnect for fresh results."
            }
          />
        )}
        {mealsQuery.data && mealsQuery.data.length === 0 && (
          <EmptyState title="No recipes found" description="Try a broader search term like chicken, pasta, or soup." />
        )}
        {mealsQuery.data && mealsQuery.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mealsQuery.data.map((meal) => (
              <MealCard key={meal.idMeal} meal={meal} fallbackCategory={query ? undefined : selectedCategory} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
