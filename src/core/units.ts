/**
 * Core Units & Measurement System
 * Supports Feet, Inches, and Fractional Inches (down to 1/16" or 1/32"),
 * as well as Decimal Inches and Metric (mm) conversions.
 */

export interface FractionalParts {
  isNegative: boolean;
  feet: number;
  inches: number;
  numerator: number;
  denominator: number;
}

export type UnitFormat = 'feet_inches_fraction' | 'inches_fraction' | 'decimal_inches' | 'metric_mm';

/**
 * Parses user input string into decimal inches.
 * Accepts formats like:
 * - 1' 4 3/8", 1' 4", 1'
 * - 16 3/8", 16-3/8, 16 3/8
 * - 14.375, 14.375"
 * - 1-4-3/8 (hyphen separated)
 * - 8 1/2
 * - -1/4" (negative)
 */
export function parseMeasurement(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }

  const str = input.trim();
  if (!str) return null;

  // Check negative
  const isNeg = str.startsWith('-');
  const clean = isNeg ? str.substring(1).trim() : str;

  // Case 1: Simple decimal number
  if (/^\d+(\.\d+)?$/.test(clean)) {
    const val = parseFloat(clean);
    return isNeg ? -val : val;
  }

  // Case 2: Feet and inches with/without fraction: e.g. 1' 4 3/8", 2' 6", 3'
  // Regex pattern: optional feet with ', optional inches, optional fraction
  const feetMatch = clean.match(/^(?:(\d+)\s*['’]\s*)?(?:(\d+)(?:\s*["”])?\s*)?(?:(\d+)\s*\/\s*(\d+)(?:\s*["”])?)?$/);
  if (feetMatch && (feetMatch[1] || feetMatch[2] || feetMatch[3])) {
    const feet = feetMatch[1] ? parseInt(feetMatch[1], 10) : 0;
    const inches = feetMatch[2] ? parseInt(feetMatch[2], 10) : 0;
    const num = feetMatch[3] ? parseInt(feetMatch[3], 10) : 0;
    const den = feetMatch[4] ? parseInt(feetMatch[4], 10) : 1;

    if (den === 0) return null;
    const totalInches = (feet * 12) + inches + (num / den);
    return isNeg ? -totalInches : totalInches;
  }

  // Case 3: Hyphenated format e.g. 1-4-3/8 or 16-3/8
  const hyphenMatch = clean.match(/^(\d+)-(\d+)-(\d+)\/(\d+)$/);
  if (hyphenMatch) {
    const feet = parseInt(hyphenMatch[1], 10);
    const inches = parseInt(hyphenMatch[2], 10);
    const num = parseInt(hyphenMatch[3], 10);
    const den = parseInt(hyphenMatch[4], 10);
    if (den === 0) return null;
    const total = (feet * 12) + inches + (num / den);
    return isNeg ? -total : total;
  }

  const hyphenInchMatch = clean.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (hyphenInchMatch) {
    const inches = parseInt(hyphenInchMatch[1], 10);
    const num = parseInt(hyphenInchMatch[2], 10);
    const den = parseInt(hyphenInchMatch[3], 10);
    if (den === 0) return null;
    const total = inches + (num / den);
    return isNeg ? -total : total;
  }

  // Fallback: try standard float
  const fallback = parseFloat(clean);
  if (!isNaN(fallback)) {
    return isNeg ? -fallback : fallback;
  }

  return null;
}

/**
 * Reduce a fraction to lowest terms (e.g. 4/16 -> 1/4)
 */
export function reduceFraction(num: number, den: number): [number, number] {
  if (num === 0 || den === 0) return [0, 1];
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = Math.abs(gcd(num, den));
  return [num / divisor, den / divisor];
}

/**
 * Deconstructs decimal inches into feet, inches, and rounded fraction
 */
export function toFractionalParts(decimalInches: number, resolution: number = 16): FractionalParts {
  const isNegative = decimalInches < -0.0001;
  const absVal = Math.abs(decimalInches);

  // Round to nearest fraction step
  const roundedStep = Math.round(absVal * resolution) / resolution;

  const totalWholeInches = Math.floor(roundedStep);
  const remainder = roundedStep - totalWholeInches;

  const rawNum = Math.round(remainder * resolution);
  let num = rawNum;
  let den = resolution;
  let extraInch = 0;

  if (num >= resolution) {
    extraInch = 1;
    num = 0;
    den = 1;
  } else if (num > 0) {
    [num, den] = reduceFraction(num, den);
  } else {
    den = 1;
  }

  const adjustedInches = totalWholeInches + extraInch;
  const feet = Math.floor(adjustedInches / 12);
  const inches = adjustedInches % 12;

  return {
    isNegative,
    feet,
    inches,
    numerator: num,
    denominator: den
  };
}

/**
 * Format decimal inches as Feet, Inches, and Fraction:
 * e.g. 1' 4 3/8", 8 1/2", 1/4", 2' 0"
 */
export function formatFeetInches(decimalInches: number | null | undefined, resolution: number = 16): string {
  if (decimalInches === null || decimalInches === undefined || isNaN(decimalInches)) return '—';
  if (Math.abs(decimalInches) < 0.0001) return `0"`;

  const parts = toFractionalParts(decimalInches, resolution);
  const sign = parts.isNegative ? '-' : '';

  const fracStr = parts.numerator > 0 ? `${parts.numerator}/${parts.denominator}` : '';

  if (parts.feet > 0) {
    if (fracStr && parts.inches > 0) {
      return `${sign}${parts.feet}' ${parts.inches} ${fracStr}"`;
    } else if (fracStr) {
      return `${sign}${parts.feet}' ${fracStr}"`;
    }
    return `${sign}${parts.feet}' ${parts.inches}"`;
  }

  // Feet == 0
  if (parts.inches > 0 && fracStr) {
    return `${sign}${parts.inches} ${fracStr}"`;
  } else if (fracStr) {
    return `${sign}${fracStr}"`;
  }
  return `${sign}${parts.inches}"`;
}

/**
 * Format decimal inches as Total Inches and Fraction (e.g. 16 3/8", 1/16")
 */
export function formatInchesFraction(decimalInches: number | null | undefined, resolution: number = 16): string {
  if (decimalInches === null || decimalInches === undefined || isNaN(decimalInches)) return '—';
  if (Math.abs(decimalInches) < 0.0001) return `0"`;

  const parts = toFractionalParts(decimalInches, resolution);
  const sign = parts.isNegative ? '-' : '';
  const totalInches = (parts.feet * 12) + parts.inches;
  const fracStr = parts.numerator > 0 ? `${parts.numerator}/${parts.denominator}` : '';

  if (totalInches > 0 && fracStr) {
    return `${sign}${totalInches} ${fracStr}"`;
  } else if (fracStr) {
    return `${sign}${fracStr}"`;
  }
  return `${sign}${totalInches}"`;
}

/**
 * Format according to active user unit format
 */
export function formatMeasurement(
  decimalInches: number | null | undefined,
  format: UnitFormat = 'feet_inches_fraction',
  resolution: number = 16
): string {
  if (decimalInches === null || decimalInches === undefined || isNaN(decimalInches)) return '—';

  switch (format) {
    case 'feet_inches_fraction':
      return formatFeetInches(decimalInches, resolution);
    case 'inches_fraction':
      return formatInchesFraction(decimalInches, resolution);
    case 'decimal_inches':
      return `${decimalInches >= 0 ? '' : '-'}${Math.abs(decimalInches).toFixed(3)}"`;
    case 'metric_mm':
      return `${(decimalInches * 25.4).toFixed(1)} mm`;
    default:
      return formatFeetInches(decimalInches, resolution);
  }
}

/**
 * Helper to build decimal inches from parts (for keypad/picker)
 */
export function partsToInches(feet: number, inches: number, numerator: number, denominator: number, isNegative = false): number {
  const den = denominator || 1;
  const total = (feet * 12) + inches + (numerator / den);
  return isNegative ? -total : total;
}
