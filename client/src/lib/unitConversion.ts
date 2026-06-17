import convert from "convert-units";

export type UnitPreference = "metric" | "imperial";

type UnitFamily = "mass" | "volume";
type UnitSystem = "metric" | "imperial";

type UnitInfo = {
  unit: string;
  family: UnitFamily;
  system: UnitSystem;
  label: string;
};

type ParsedMeasure = {
  amount: number;
  unitInfo: UnitInfo;
  rest: string;
};

export type ConvertedMeasure = {
  display: string;
  original: string;
  wasConverted: boolean;
};

const UNIT_ALIASES: Array<[string, UnitInfo]> = [
  ["tablespoons", { unit: "Tbs", family: "volume", system: "imperial", label: "Tbsp" }],
  ["tablespoon", { unit: "Tbs", family: "volume", system: "imperial", label: "Tbsp" }],
  ["tbsp", { unit: "Tbs", family: "volume", system: "imperial", label: "Tbsp" }],
  ["tbs", { unit: "Tbs", family: "volume", system: "imperial", label: "Tbsp" }],
  ["teaspoons", { unit: "tsp", family: "volume", system: "imperial", label: "tsp" }],
  ["teaspoon", { unit: "tsp", family: "volume", system: "imperial", label: "tsp" }],
  ["tsp", { unit: "tsp", family: "volume", system: "imperial", label: "tsp" }],
  ["fluid ounces", { unit: "fl-oz", family: "volume", system: "imperial", label: "fl oz" }],
  ["fluid ounce", { unit: "fl-oz", family: "volume", system: "imperial", label: "fl oz" }],
  ["fl oz", { unit: "fl-oz", family: "volume", system: "imperial", label: "fl oz" }],
  ["fl-oz", { unit: "fl-oz", family: "volume", system: "imperial", label: "fl oz" }],
  ["cups", { unit: "cup", family: "volume", system: "imperial", label: "cups" }],
  ["cup", { unit: "cup", family: "volume", system: "imperial", label: "cup" }],
  ["pints", { unit: "pnt", family: "volume", system: "imperial", label: "pt" }],
  ["pint", { unit: "pnt", family: "volume", system: "imperial", label: "pt" }],
  ["pt", { unit: "pnt", family: "volume", system: "imperial", label: "pt" }],
  ["quarts", { unit: "qt", family: "volume", system: "imperial", label: "qt" }],
  ["quart", { unit: "qt", family: "volume", system: "imperial", label: "qt" }],
  ["qt", { unit: "qt", family: "volume", system: "imperial", label: "qt" }],
  ["gallons", { unit: "gal", family: "volume", system: "imperial", label: "gal" }],
  ["gallon", { unit: "gal", family: "volume", system: "imperial", label: "gal" }],
  ["gal", { unit: "gal", family: "volume", system: "imperial", label: "gal" }],
  ["kilograms", { unit: "kg", family: "mass", system: "metric", label: "kg" }],
  ["kilogram", { unit: "kg", family: "mass", system: "metric", label: "kg" }],
  ["kgs", { unit: "kg", family: "mass", system: "metric", label: "kg" }],
  ["kg", { unit: "kg", family: "mass", system: "metric", label: "kg" }],
  ["grams", { unit: "g", family: "mass", system: "metric", label: "g" }],
  ["gram", { unit: "g", family: "mass", system: "metric", label: "g" }],
  ["g", { unit: "g", family: "mass", system: "metric", label: "g" }],
  ["milliliters", { unit: "ml", family: "volume", system: "metric", label: "ml" }],
  ["milliliter", { unit: "ml", family: "volume", system: "metric", label: "ml" }],
  ["millilitres", { unit: "ml", family: "volume", system: "metric", label: "ml" }],
  ["millilitre", { unit: "ml", family: "volume", system: "metric", label: "ml" }],
  ["ml", { unit: "ml", family: "volume", system: "metric", label: "ml" }],
  ["liters", { unit: "l", family: "volume", system: "metric", label: "L" }],
  ["liter", { unit: "l", family: "volume", system: "metric", label: "L" }],
  ["litres", { unit: "l", family: "volume", system: "metric", label: "L" }],
  ["litre", { unit: "l", family: "volume", system: "metric", label: "L" }],
  ["l", { unit: "l", family: "volume", system: "metric", label: "L" }],
  ["pounds", { unit: "lb", family: "mass", system: "imperial", label: "lb" }],
  ["pound", { unit: "lb", family: "mass", system: "imperial", label: "lb" }],
  ["lbs", { unit: "lb", family: "mass", system: "imperial", label: "lb" }],
  ["lb", { unit: "lb", family: "mass", system: "imperial", label: "lb" }],
  ["ounces", { unit: "oz", family: "mass", system: "imperial", label: "oz" }],
  ["ounce", { unit: "oz", family: "mass", system: "imperial", label: "oz" }],
  ["oz", { unit: "oz", family: "mass", system: "imperial", label: "oz" }],
];

export function convertMeasure(measure: string, preference: UnitPreference): ConvertedMeasure {
  const parsed = parseMeasure(measure);

  if (!parsed || parsed.unitInfo.system === preference) {
    return {
      display: measure,
      original: measure,
      wasConverted: false,
    };
  }

  try {
    const converted = convertToPreference(parsed.amount, parsed.unitInfo, preference);
    const display = `${formatNumber(converted.amount)} ${converted.label}${parsed.rest ? ` ${parsed.rest}` : ""}`;

    return {
      display,
      original: measure,
      wasConverted: display.toLowerCase() !== measure.toLowerCase(),
    };
  } catch {
    return {
      display: measure,
      original: measure,
      wasConverted: false,
    };
  }
}

function parseMeasure(measure: string): ParsedMeasure | null {
  const trimmed = measure.trim();
  const mixedMatch = trimmed.match(/^(\d+(?:\.\d+)?)(?:\s+(\d+)\/(\d+))?\s*(.*)$/);
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/);

  let amount: number;
  let remainder: string;

  if (fractionMatch && !trimmed.match(/^\d+(?:\.\d+)?\s+\d+\/\d+/)) {
    amount = Number(fractionMatch[1]) / Number(fractionMatch[2]);
    remainder = fractionMatch[3].trim();
  } else if (mixedMatch) {
    amount = Number(mixedMatch[1]);

    if (mixedMatch[2] && mixedMatch[3]) {
      amount += Number(mixedMatch[2]) / Number(mixedMatch[3]);
    }

    remainder = mixedMatch[4].trim();
  } else {
    return null;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const alias = UNIT_ALIASES.find(([candidate]) => {
    const normalized = remainder.toLowerCase();
    return normalized === candidate || normalized.startsWith(`${candidate} `);
  });

  if (!alias) {
    return null;
  }

  const [matchedText, unitInfo] = alias;
  const rest = remainder.slice(matchedText.length).trim();

  return {
    amount,
    unitInfo,
    rest,
  };
}

function convertToPreference(amount: number, unitInfo: UnitInfo, preference: UnitPreference) {
  if (preference === "metric") {
    if (unitInfo.family === "mass") {
      const grams = convert(amount).from(unitInfo.unit).to("g");
      return grams >= 1000
        ? { amount: grams / 1000, label: "kg" }
        : { amount: grams, label: "g" };
    }

    const milliliters = convert(amount).from(unitInfo.unit).to("ml");
    return milliliters >= 1000
      ? { amount: milliliters / 1000, label: "L" }
      : { amount: milliliters, label: "ml" };
  }

  if (unitInfo.family === "mass") {
    const ounces = convert(amount).from(unitInfo.unit).to("oz");
    return ounces >= 16
      ? { amount: ounces / 16, label: "lb" }
      : { amount: ounces, label: "oz" };
  }

  const cups = convert(amount).from(unitInfo.unit).to("cup");
  if (cups >= 0.25) {
    return { amount: cups, label: cups === 1 ? "cup" : "cups" };
  }

  const tablespoons = convert(amount).from(unitInfo.unit).to("Tbs");
  if (tablespoons >= 1) {
    return { amount: tablespoons, label: "Tbsp" };
  }

  return { amount: convert(amount).from(unitInfo.unit).to("tsp"), label: "tsp" };
}

function formatNumber(value: number) {
  if (value >= 100) {
    return Math.round(value).toString();
  }

  return Number(value.toFixed(2)).toString();
}
