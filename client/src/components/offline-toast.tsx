import { useEffect } from "react";
import { toast } from "sonner";

export function OfflineToast() {
  useEffect(() => {
    const handleOffline = () => {
      toast.warning("You are offline", {
        description: "Cached recipes and saved favorites are still available.",
      });
    };

    const handleOnline = () => {
      toast.success("Back online", {
        description: "Fresh recipe data will load again.",
      });
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
