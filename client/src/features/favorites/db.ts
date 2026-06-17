import { openDB, type DBSchema } from "idb";
import type { MealDetail } from "@/lib/api";

export type FavoriteMeal = MealDetail & {
  favoritedAt: number;
};

interface RecipesDb extends DBSchema {
  favorites: {
    key: string;
    value: FavoriteMeal;
    indexes: {
      "by-date": number;
      "by-name": string;
    };
  };
}

const dbPromise = openDB<RecipesDb>("recipe-pantry", 1, {
  upgrade(db) {
    const store = db.createObjectStore("favorites", {
      keyPath: "idMeal",
    });
    store.createIndex("by-date", "favoritedAt");
    store.createIndex("by-name", "strMeal");
  },
});

export async function saveFavorite(meal: MealDetail) {
  const db = await dbPromise;
  const favorite: FavoriteMeal = {
    ...meal,
    favoritedAt: Date.now(),
  };

  // Store the full meal payload so favorites remain useful with no network.
  await db.put("favorites", favorite);
  return favorite;
}

export async function removeFavorite(id: string) {
  const db = await dbPromise;
  await db.delete("favorites", id);
}

export async function getFavorite(id: string) {
  const db = await dbPromise;
  return db.get("favorites", id);
}

export async function getAllFavorites() {
  const db = await dbPromise;
  return db.getAllFromIndex("favorites", "by-date");
}
