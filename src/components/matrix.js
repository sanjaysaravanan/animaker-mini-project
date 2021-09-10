// Create Empty Sheet
export const createEmpty = (rows, columns) => {
  const matrix = Array(rows);
  for (let i = 0; i < rows; i++) {
    matrix[i] = Array(columns);
  }
  return matrix;
};

/** Gets the value at row and column of matrix. */
export const get = (point, matrix) => {
  const columns = matrix[point.row];
  if (columns === undefined) {
    return undefined;
  }
  return columns[point.column];
};

/** Creates a slice of matrix from startPoint up to, but not including, endPoint. */
export const slice = (startPoint, endPoint, matrix) => {
  const sliced = [];
  const columns = endPoint.column - startPoint.column;
  for (let row = startPoint.row; row <= endPoint.row; row++) {
    const slicedRow = row - startPoint.row;
    sliced[slicedRow] = sliced[slicedRow] || Array(columns);
    for (let column = startPoint.column; column <= endPoint.column; column++) {
      sliced[slicedRow][column - startPoint.column] = get(
        { row, column },
        matrix
      );
    }
  }
  return sliced;
};

/** Sets the value at row and column of matrix. If a row doesn't exist, it's created. */
export const set = (point, value, matrix) => {
  const nextMatrix = [...matrix];

  // Synchronize first row length
  const firstRow = matrix[0];
  const nextFirstRow = firstRow ? [...firstRow] : [];
  if (nextFirstRow.length - 1 < point.column) {
    nextFirstRow[point.column] = undefined;
    nextMatrix[0] = nextFirstRow;
  }

  const nextRow = matrix[point.row] ? [...matrix[point.row]] : [];
  nextRow[point.column] = value;
  nextMatrix[point.row] = nextRow;

  return nextMatrix;
};

/** Like Matrix.set() but mutates the matrix */
export const mutableSet = (point, value, matrix) => {
  let firstRow = matrix[0];
  if (!firstRow) {
    firstRow = [];
    matrix[0] = firstRow;
  }
  if (!(point.row in matrix)) {
    matrix[point.row] = [];
  }
  // Synchronize first row length
  if (!(point.column in firstRow)) {
    firstRow[point.column] = undefined;
  }
  matrix[point.row][point.column] = value;
};

/** Removes the coordinate of matrix */
export const unset = (point, matrix) => {
  if (!has(point, matrix)) {
    return matrix;
  }
  const nextMatrix = [...matrix];
  const nextRow = [...matrix[point.row]];

  // Avoid deleting to preserve first row length
  nextRow[point.column] = undefined;
  nextMatrix[point.row] = nextRow;

  return nextMatrix;
};

/** Creates an array of values by running each element in collection thru iteratee. */
export const map = (func, matrix) => {
  const newMatrix = [];
  for (const [row, values] of matrix.entries()) {
    for (const [column, value] of values.entries()) {
      const point = { row, column };
      mutableSet(point, func(value, point), newMatrix);
    }
  }
  return newMatrix;
};

/**
 * Converts all elements in row into a string separated by horizontalSeparator and each row string
 * to string separated by verticalSeparator
 */
export const join = (
  matrix,
  horizontalSeparator = "\t",
  verticalSeparator = "\n"
) => {
  let joined = "";
  const { rows, columns } = getSize(matrix);
  for (let row = 0; row < rows; row++) {
    if (row) {
      joined += verticalSeparator;
    }
    for (let column = 0; column < columns; column++) {
      if (column) {
        joined += horizontalSeparator;
      }
      if (matrix[row] && column in matrix[row]) {
        joined += String(matrix[row][column]);
      }
    }
  }
  return joined;
};

/**
 * Parses a CSV separated by a horizontalSeparator and verticalSeparator into a
 * Matrix using a transform function
 */
export const split = (
  csv,
  transform,
  horizontalSeparator = "\t",
  verticalSeparator = /\r\n|\n|\r/
) => {
  return csv
    .split(verticalSeparator)
    .map((row) => row.split(horizontalSeparator).map(transform));
};

/** Returns whether the point exists in the matrix or not. */
export const has = (point, matrix) => {
  const firstRow = matrix[0];
  return (
    firstRow &&
    // validation
    point.row >= 0 &&
    point.column >= 0 &&
    Number.isInteger(point.row) &&
    Number.isInteger(point.column) &&
    // first row length is in sync with other rows
    point.column < firstRow.length &&
    point.row < matrix.length
  );
};

/** Matrix size */
export class Size {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
  }
}

/** Gets the size of matrix by returning its number of rows and columns */
export const getSize = (matrix) => {
  const firstRow = matrix[0];
  return {
    columns: firstRow ? firstRow.length : 0,
    rows: matrix.length,
  };
};

export const padRows = (matrix, totalRows, totalColumns) => {
  const { rows, columns } = getSize(matrix);

  if (rows >= totalRows && columns >= totalColumns) {
    return matrix;
  }

  const missingRows = totalRows - rows;
  const missingColumns = totalColumns - columns;
  if (missingColumns)
    matrix[0] = matrix[0].concat(Array(missingColumns).fill(undefined));
  const emptyRow = Array(totalColumns).fill(undefined);
  const emptyRows = Array(missingRows).fill(emptyRow);
  return [...matrix, ...emptyRows];
};

// export const padColumns = (matrix, totalColumns) => {
//   const { rows, columns } = getSize(matrix);

//   if (columns >= totalColumns) {
//     return matrix;
//   }

//   const missingColumns = totalRows - rows;
//   const emptyRow = Array(columns).fill(undefined);
//   const emptyRows = Array(missingRows).fill(emptyRow);
//   return [...matrix, ...emptyRows];
// };

export const toArray = (matrix, transform) => {
  const array = [];
  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix.length; column++) {
      const value = matrix[row][column];
      array.push(transform ? transform(value, { row, column }) : value);
    }
  }

  return array;
};

/** Returns the maximum point in the matrix */
export const maxPoint = (matrix) => {
  const size = getSize(matrix);
  return { row: size.rows - 1, column: size.columns - 1 };
};
