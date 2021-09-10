import { extractLabel } from "hot-formula-parser";

export const FORMULA_VALUE_PREFIX = "=";
const FORMULA_REFERENCES = /\$?[A-Z]+\$?[0-9]+/g;

/** Returns whether given value is a formula */
export const isFormulaValue = (value) => {
  return typeof value === "string" && value.startsWith(FORMULA_VALUE_PREFIX);
};

/** Extracts formula from value  */
export const extractFormula = (value) => {
  return value.slice(1);
};

/**
 * For given formula returns the cell references
 * formula - formula to get references for
 */
export const getReferences = (formula) => {
  const match = formula.match(FORMULA_REFERENCES);
  return match
    ? match.map((substr) => {
        const [row, column] = extractLabel(substr);
        return { row: row.index, column: column.index };
      })
    : [];
};
