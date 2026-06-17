import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getFavorite, removeFavorite, saveFavorite } from "@/features/favorites/db";
import { getMeal, type MealDetail, type MealSummary } from "@/lib/api";

type Props = {
  meal: MealSummary | MealDetail;
  variant?: "icon" | "default";
};

function isMealDetail(meal: MealSummary | MealDetail): meal is MealDetail {
  return "strInstructions" in meal && Boolean(meal.strInstructions);
}

export function FavoriteButton({ meal, variant = "icon" }: Props) {
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getFavorite(meal.idMeal).then((favorite) => {
      if (mounted) {
        setIsFavorite(Boolean(favorite));
      }
    });

    return () => {
      mounted = false;
    };
  }, [meal.idMeal]);

  async function resolveMealDetail() {
    if (isMealDetail(meal)) {
      return meal;
    }

    const cached = queryClient.getQueryData<MealDetail>(["meal", meal.idMeal]);
    if (cached) {
      return cached;
    }

    return getMeal(meal.idMeal);
  }

  async function toggleFavorite() {
    setIsSaving(true);

    try {
      if (isFavorite) {
        await removeFavorite(meal.idMeal);
        setIsFavorite(false);
        window.dispatchEvent(new Event("favorites-changed"));
        toast("Removed from favorites");
        return;
      }

      const detail = await resolveMealDetail();
      await saveFavorite(detail);
      setIsFavorite(true);
      window.dispatchEvent(new Event("favorites-changed"));
      toast.success("Saved to favorites", {
        description: "This recipe is available offline.",
      });
    } catch {
      toast.error("Could not save favorite", {
        description: navigator.onLine
          ? "Open the recipe details and try again."
          : "This recipe detail is not cached yet. Favorites already saved still work offline.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Button
      type="button"
      variant={isFavorite ? "default" : "outline"}
      size={variant === "icon" ? "icon" : "default"}
      onClick={toggleFavorite}
      aria-label={`${isFavorite ? "Remove" : "Save"} ${meal.strMeal} ${isFavorite ? "from" : "to"} favorites`}
      aria-pressed={isFavorite}
      disabled={isSaving}
    >
      <Heart className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} aria-hidden="true" />
      {variant === "default" ? (isSaving ? "Saving..." : isFavorite ? "Remove favorite" : "Add favorite") : null}
    </Button>
  );
}
