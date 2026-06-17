export type MealSummary = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
};

export type MealDetail = MealSummary & {
  strInstructions: string;
  strYoutube?: string;
  strSource?: string;
  strTags?: string;
  [key: `strIngredient${number}`]: string | undefined;
  [key: `strMeasure${number}`]: string | undefined;
};

type MealResponse<T> = {
  meals: T[] | null;
};

type CategoryResponse = {
  categories: Category[];
};

export type Category = {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
};

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function searchMeals(query: string, signal?: AbortSignal) {
  return request<MealResponse<MealDetail>>(`/api/search?s=${encodeURIComponent(query)}`, signal).then(
    (data) => data.meals ?? [],
  );
}

export function getMeal(id: string, signal?: AbortSignal) {
  return request<MealResponse<MealDetail>>(`/api/meal/${encodeURIComponent(id)}`, signal).then((data) => {
    const meal = data.meals?.[0];

    if (!meal) {
      throw new Error("Recipe not found");
    }

    return meal;
  });
}

export function getCategories(signal?: AbortSignal) {
  return request<CategoryResponse>("/api/categories", signal).then((data) => data.categories);
}

export function getMealsByCategory(category: string, signal?: AbortSignal) {
  return request<MealResponse<MealSummary>>(`/api/filter?c=${encodeURIComponent(category)}`, signal).then(
    (data) => data.meals ?? [],
  );
}

export function getIngredients(meal: MealDetail) {
  return Array.from({ length: 20 }, (_, index) => {
    const item = index + 1;
    const ingredient = meal[`strIngredient${item}`]?.trim();
    const measure = meal[`strMeasure${item}`]?.trim();

    if (!ingredient) {
      return null;
    }

    return {
      ingredient,
      measure: measure || "To taste",
    };
  }).filter((entry): entry is { ingredient: string; measure: string } => Boolean(entry));
}
