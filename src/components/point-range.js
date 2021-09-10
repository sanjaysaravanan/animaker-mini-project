/** Creates a normalized range between two given points */
export const create = (source, target) => {
  return {
    start: {
      row: Math.min(source.row, target.row),
      column: Math.min(source.column, target.column),
    },
    end: {
      row: Math.max(source.row, target.row),
      column: Math.max(source.column, target.column),
    },
  };
};

/** Iterates through all the existing points in given range */
export function* iterate(range) {
  for (let row = range.start.row; row <= range.end.row; row++) {
    for (
      let column = range.start.column;
      column <= range.end.column;
      column++
    ) {
      yield { row, column };
    }
  }
}

/** Returns the size (rows x columns) of the given range */
export const size = (range) => {
  const rows = range.end.row + 1 - range.start.row;
  const columns = range.end.column + 1 - range.start.column;
  return rows * columns;
};

/** Returns whether given point exists in given range */
export const has = (range, point) => {
  return (
    point.row >= range.start.row &&
    point.column >= range.start.column &&
    point.row <= range.end.row &&
    point.column <= range.end.column
  );
};

/** Limits given masked range with given mask */
export const mask = (masked, _mask) => {
  return {
    start: {
      row:
        _mask.start.row > masked.start.row ? _mask.start.row : masked.start.row,
      column:
        _mask.start.column > masked.start.column
          ? _mask.start.column
          : masked.start.column,
    },
    end: {
      row: _mask.end.row < masked.end.row ? _mask.end.row : masked.end.row,
      column:
        _mask.end.column < masked.end.column
          ? _mask.end.column
          : masked.end.column,
    },
  };
};
