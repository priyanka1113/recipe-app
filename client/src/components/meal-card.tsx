import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import type { MealSummary } from "@/lib/api";

type Props = {
  meal: MealSummary;
  fallbackCategory?: string;
};

export function MealCard({ meal, fallbackCategory }: Props) {
  return (
    <Card className="group overflow-hidden">
      <Link to={`/meal/${meal.idMeal}`} className="block">
        <img
          src={meal.strMealThumb}
          alt={`${meal.strMeal} plated dish`}
          className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
          loading="lazy"
        />
      </Link>
      <CardHeader className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {(meal.strCategory || fallbackCategory) && <Badge variant="secondary">{meal.strCategory || fallbackCategory}</Badge>}
          {meal.strArea && <Badge variant="outline">{meal.strArea}</Badge>}
        </div>
        <CardTitle className="line-clamp-2 text-lg">
          <Link to={`/meal/${meal.idMeal}`} className="hover:text-primary">
            {meal.strMeal}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <p className="text-sm text-muted-foreground">Open for ingredients, instructions, video, and offline saving.</p>
      </CardContent>
      <CardFooter className="justify-between gap-3 p-4 pt-2">
        <Link to={`/meal/${meal.idMeal}`} className="text-sm font-medium text-primary hover:underline">
          View recipe
        </Link>
        <FavoriteButton meal={meal} />
      </CardFooter>
    </Card>
  );
}
