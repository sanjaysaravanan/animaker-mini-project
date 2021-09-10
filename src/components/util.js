import * as Matrix from "./matrix";
import * as Point from "./point";
import * as PointRange from "./point-range";
import * as Formula from "./formula";

export { createEmpty as createEmptyMatrix } from "./matrix";
export const PLAIN_TEXT_MIME = "text/plain";

/** Move the cursor of given input element to the input's end */
export function moveCursorToEnd(el) {
  el.selectionStart = el.selectionEnd = el.value.length;
}

/**
 * Creates an array of numbers (positive and/or negative) progressing from start up to, but not including, end. A step of -1 is used if a negative start is specified without an end or step. If end is not specified, it's set to start with start then set to 0.
 * @param end - an integer number specifying at which position to stop (not included).
 * @param start - An integer number specifying at which position to start.
 * @param step - An integer number specifying the incrementation
 */
export function range(end, start = 0, step = 1) {
  const array = [];
  if (Math.sign(end - start) === -1) {
    for (let element = start; element > end; element -= step) {
      array.push(element);
    }
    return array;
  }
  for (let element = start; element < end; element += step) {
    array.push(element);
  }
  return array;
}

/** Return whether given point is active */
export function isActive(active, point) {
  return Boolean(active && Point.isEqual(point, active));
}

/** Get the offset values of given element */
export function getOffsetRect(element) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
    left: element.offsetLeft,
    top: element.offsetTop,
  };
}

/** Write given data to clipboard with given event */
export function writeTextToClipboard(event, data): void {
  event.clipboardData?.setData(PLAIN_TEXT_MIME, data);
}

/** Read text from given clipboard event */
export function readTextFromClipboard(event) {
  if (window.clipboardData && window.clipboardData.getData) {
    return window.clipboardData.getData("Text");
  }
  if (event.clipboardData && event.clipboardData.getData) {
    return event.clipboardData.getData(PLAIN_TEXT_MIME);
  }
  return "";
}

/** Get the dimensions of cell at point from state */
export function getCellDimensions(point, state) {
  const rowDimensions = state.rowDimensions[point.row];
  const columnDimensions = state.columnDimensions[point.column];
  return (
    rowDimensions &&
    columnDimensions && { ...rowDimensions, ...columnDimensions }
  );
}

/** Get the dimensions of a range of cells */
export function getRangeDimensions(state, _range) {
  const startDimensions = getCellDimensions(_range.start, state);
  const endDimensions = getCellDimensions(_range.end, state);
  return (
    startDimensions &&
    endDimensions && {
      width: endDimensions.left + endDimensions.width - startDimensions.left,
      height: endDimensions.top + endDimensions.height - startDimensions.top,
      top: startDimensions.top,
      left: startDimensions.left,
    }
  );
}

/** Get the computed value of a cell. */
export function getComputedValue({ cell, formulaParser }) {
  if (cell === undefined) {
    return null;
  }
  if (isFormulaCell(cell)) {
    return getFormulaComputedValue({ cell, formulaParser });
  }
  return cell.value;
}

/** Get the computed value of a formula cell */
export function getFormulaComputedValue({ cell, formulaParser }) {
  const formula = Formula.extractFormula(cell.value);
  const { result, error } = formulaParser.parse(formula);
  return error || result;
}

/** Returns whether given cell contains a formula value */
export function isFormulaCell(cell) {
  return Formula.isFormulaValue(cell.value);
}

/** Normalize given selected range to given data matrix */
export function normalizeSelected(selected, data) {
  const dataRange = getMatrixRange(data);
  return selected && PointRange.mask(selected, dataRange);
}

/** Get the point range of given matrix */
export function getMatrixRange(data) {
  const maxPoint = Matrix.maxPoint(data);
  return PointRange.create(Point.ORIGIN, maxPoint);
}

/** Get given selected range from given data as CSV */
export function getSelectedCSV(selected, data) {
  if (!selected) {
    return "";
  }
  const selectedData = getRangeFromMatrix(selected, data);
  return getCSV(selectedData);
}

/** Get given data as CSV */
export function getCSV(data) {
  const valueMatrix = Matrix.map((cell) => cell?.value || "", data);
  return Matrix.join(valueMatrix);
}

export function getRangeFromMatrix(_range, matrix) {
  return Matrix.slice(_range.start, _range.end, matrix);
}

/**
 * Calculate the rows and columns counts of a spreadsheet
 * @param data - the spreadsheet's data
 * @param rowLabels - the spreadsheet's row labels (if defined)
 * @param columnLabels - the spreadsheet's column labels (if defined)
 * @returns the rows and columns counts of a spreadsheet
 */
export function calculateSpreadsheetSize(data, rowLabels, columnLabels) {
  const { columns, rows } = Matrix.getSize(data);
  return {
    rows: rowLabels ? Math.max(rows, rowLabels.length) : rows,
    columns: columnLabels ? Math.max(columns, columnLabels.length) : columns,
  };
}
