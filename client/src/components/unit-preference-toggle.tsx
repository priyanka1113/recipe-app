import { Button } from "@/components/ui/button";
import { useUnitPreference } from "@/components/unit-preference-provider";
import type { UnitPreference } from "@/lib/unitConversion";

const OPTIONS: Array<{ label: string; value: UnitPreference }> = [
  { label: "Metric", value: "metric" },
  { label: "Imperial", value: "imperial" },
];

export function UnitPreferenceToggle() {
  const { unitPreference, setUnitPreference } = useUnitPreference();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Units</span>
      <div className="flex rounded-md border p-1" role="group" aria-label="Choose ingredient units">
        {OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={unitPreference === option.value ? "default" : "ghost"}
            onClick={() => setUnitPreference(option.value)}
            aria-pressed={unitPreference === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
