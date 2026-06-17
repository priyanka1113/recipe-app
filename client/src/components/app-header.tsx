import { FormEvent, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { ChefHat, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold" aria-label="Recipe Pantry home">
            <span className="rounded-full bg-primary p-2 text-primary-foreground">
              <ChefHat className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>Recipe Pantry</span>
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <form className="relative flex-1 md:max-w-md" role="search" onSubmit={handleSubmit}>
          <label htmlFor="global-search" className="sr-only">
            Search recipes
          </label>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="global-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chicken, pasta, curry..."
            className="pl-9"
          />
        </form>

        <nav className="flex items-center gap-2" aria-label="Primary navigation">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn("rounded-md px-3 py-2 text-sm font-medium hover:bg-accent", isActive && "bg-accent")
            }
            end
          >
            Browse
          </NavLink>
          <Button asChild variant="outline">
            <NavLink to="/favorites">
              <Heart className="h-4 w-4" aria-hidden="true" />
              Favorites
            </NavLink>
          </Button>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
