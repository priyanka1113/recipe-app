import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/app-header";
import { OfflineToast } from "@/components/offline-toast";
import { Home } from "@/pages/Home";
import { Details } from "@/pages/Details";
import { Favorites } from "@/pages/Favorites";

export function App() {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AppHeader />
      <main id="main-content" className="container py-6 md:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/meal/:id" element={<Details />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </main>
      <OfflineToast />
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
