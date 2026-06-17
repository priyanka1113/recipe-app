import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Ingredient = {
  ingredient: string;
  measure: string;
};

type ReaderStatus = "idle" | "speaking" | "paused";
type ReadMode = "full" | "ingredients" | "instructions";

type Props = {
  title: string;
  ingredients: Ingredient[];
  instructions: string;
};

export function RecipeReader({ title, ingredients, instructions }: Props) {
  const [status, setStatus] = useState<ReaderStatus>("idle");
  const [readMode, setReadMode] = useState<ReadMode>("full");
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const readAloudText = useMemo(() => {
    const ingredientText = ingredients
      .map(({ ingredient, measure }) => `${measure} ${ingredient}`)
      .join(". ");
    const cleanInstructions = instructions.replace(/\s+/g, " ").trim();

    if (readMode === "ingredients") {
      return `${title}. Ingredients. ${ingredientText}`;
    }

    if (readMode === "instructions") {
      return `${title}. Instructions. ${cleanInstructions}`;
    }

    return `${title}. Ingredients. ${ingredientText}. Instructions. ${cleanInstructions}`;
  }, [ingredients, instructions, readMode, title]);

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  function startReading() {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(readAloudText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");

    window.speechSynthesis.speak(utterance);
    setStatus("speaking");
  }

  function pauseReading() {
    window.speechSynthesis.pause();
    setStatus("paused");
  }

  function resumeReading() {
    window.speechSynthesis.resume();
    setStatus("speaking");
  }

  function stopReading() {
    window.speechSynthesis.cancel();
    setStatus("idle");
  }

  function changeReadMode(mode: ReadMode) {
    setReadMode(mode);
    stopReading();
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" aria-hidden="true" />
            Hands-free cooking
          </CardTitle>
          <CardDescription>Your browser does not support reading recipes aloud.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" aria-hidden="true" />
          Hands-free cooking
        </CardTitle>
        <CardDescription>Have the recipe read aloud while you cook, then pause or stop anytime.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">What should be read?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose recipe read aloud section">
            <Button
              type="button"
              variant={readMode === "full" ? "default" : "outline"}
              size="sm"
              onClick={() => changeReadMode("full")}
              aria-pressed={readMode === "full"}
            >
              Full recipe
            </Button>
            <Button
              type="button"
              variant={readMode === "ingredients" ? "default" : "outline"}
              size="sm"
              onClick={() => changeReadMode("ingredients")}
              aria-pressed={readMode === "ingredients"}
            >
              Ingredients only
            </Button>
            <Button
              type="button"
              variant={readMode === "instructions" ? "default" : "outline"}
              size="sm"
              onClick={() => changeReadMode("instructions")}
              aria-pressed={readMode === "instructions"}
            >
              Instructions only
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={startReading}>
            {status === "idle" ? <Play className="h-4 w-4" aria-hidden="true" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
            {status === "idle" ? "Start reading" : "Restart"}
          </Button>

          {status === "speaking" && (
            <Button type="button" variant="outline" onClick={pauseReading}>
              <Pause className="h-4 w-4" aria-hidden="true" />
              Pause
            </Button>
          )}

          {status === "paused" && (
            <Button type="button" variant="outline" onClick={resumeReading}>
              <Play className="h-4 w-4" aria-hidden="true" />
              Resume
            </Button>
          )}

          {status !== "idle" && (
            <Button type="button" variant="outline" onClick={stopReading}>
              <Square className="h-4 w-4" aria-hidden="true" />
              Stop
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {status === "idle" && `Ready to read ${readMode === "full" ? "the full recipe" : readMode} aloud.`}
          {status === "speaking" && `Reading ${readMode === "full" ? "the full recipe" : readMode} aloud.`}
          {status === "paused" && "Reading paused."}
        </p>
      </CardContent>
    </Card>
  );
}
