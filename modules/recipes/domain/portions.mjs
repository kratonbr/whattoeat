import { DEFAULT_RECIPE_LOCALE } from "./recipes.mjs";

const fractionGlyphs = Object.freeze({
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
  "1/5": "⅕",
  "2/5": "⅖",
  "3/5": "⅗",
  "4/5": "⅘",
  "1/6": "⅙",
  "5/6": "⅚",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
  "1/10": "⅒",
});

function greatestCommonDivisor(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;

  while (b !== 0n) {
    [a, b] = [b, a % b];
  }

  return a;
}

function parseDecimal(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;

  const match = String(value).trim().match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) return null;

  const fraction = match[3] ?? "";
  const denominator = 10n ** BigInt(fraction.length);
  const digits = BigInt(match[2] + fraction);
  const numerator = match[1] === "-" ? -digits : digits;
  const divisor = greatestCommonDivisor(numerator, denominator) || 1n;

  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function formatRational(numerator, denominator, locale) {
  if (denominator === 0n) return null;

  const sign = numerator < 0n ? "-" : "";
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const whole = absoluteNumerator / denominator;
  const remainder = absoluteNumerator % denominator;

  if (remainder === 0n) return sign + whole.toString();

  const reducedFraction = `${remainder}/${denominator}`;
  const fractionText = fractionGlyphs[reducedFraction] ?? reducedFraction;
  if (whole === 0n && fractionGlyphs[`${absoluteNumerator}/${denominator}`]) {
    return sign + fractionGlyphs[`${absoluteNumerator}/${denominator}`];
  }
  if (whole > 0n && fractionGlyphs[reducedFraction]) {
    return `${sign}${whole} ${fractionText}`;
  }

  let remainderDenominator = denominator;
  let twos = 0;
  let fives = 0;

  while (remainderDenominator % 2n === 0n) {
    remainderDenominator /= 2n;
    twos += 1;
  }
  while (remainderDenominator % 5n === 0n) {
    remainderDenominator /= 5n;
    fives += 1;
  }

  const decimalPlaces = Math.max(twos, fives);
  if (remainderDenominator === 1n && decimalPlaces <= 6) {
    const scale = 10n ** BigInt(decimalPlaces);
    const scaled = (absoluteNumerator * scale) / denominator;
    const decimalWhole = scaled / scale;
    const decimalFraction = (scaled % scale)
      .toString()
      .padStart(decimalPlaces, "0")
      .replace(/0+$/, "");
    const separator = locale === "pt-BR" ? "," : ".";
    return `${sign}${decimalWhole}${separator}${decimalFraction}`;
  }

  if (whole > 0n) return `${sign}${whole} ${fractionText}`;
  return `${sign}${absoluteNumerator}/${denominator}`;
}

export function formatPortionQuantity(
  quantity,
  originalServings,
  requestedServings,
  locale = DEFAULT_RECIPE_LOCALE,
) {
  if (
    !Number.isSafeInteger(originalServings) ||
    originalServings <= 0 ||
    !Number.isSafeInteger(requestedServings) ||
    requestedServings <= 0
  ) {
    return null;
  }

  const amount = parseDecimal(quantity);
  if (!amount) return null;

  const numerator = amount.numerator * BigInt(requestedServings);
  const denominator = amount.denominator * BigInt(originalServings);
  const divisor = greatestCommonDivisor(numerator, denominator) || 1n;

  return formatRational(numerator / divisor, denominator / divisor, locale);
}
