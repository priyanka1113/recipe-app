import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UnitPreference } from "@/lib/unitConversion";

type UnitPreferenceContextValue = {
  unitPreference: UnitPreference;
  setUnitPreference: (preference: UnitPreference) => void;
};

const UnitPreferenceContext = createContext<UnitPreferenceContextValue | undefined>(undefined);

export function UnitPreferenceProvider({ children }: { children: ReactNode }) {
  const [unitPreference, setUnitPreference] = useState<UnitPreference>(() => {
    const stored = localStorage.getItem("recipe-unit-preference");
    return stored === "imperial" || stored === "metric" ? stored : "metric";
  });

  useEffect(() => {
    localStorage.setItem("recipe-unit-preference", unitPreference);
  }, [unitPreference]);

  const value = useMemo(
    () => ({
      unitPreference,
      setUnitPreference,
    }),
    [unitPreference],
  );

  return <UnitPreferenceContext.Provider value={value}>{children}</UnitPreferenceContext.Provider>;
}

export function useUnitPreference() {
  const context = useContext(UnitPreferenceContext);

  if (!context) {
    throw new Error("useUnitPreference must be used within UnitPreferenceProvider");
  }

  return context;
}
