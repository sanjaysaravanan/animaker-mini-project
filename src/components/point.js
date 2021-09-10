// Point Constants
export class Point {
  constructor(column, row) {
    this.column = column;
    this.row = row;
  }
}

export const isEqual = (source, target) => {
  return source.column === target.column && source.row === target.row;
};

export const ORIGIN = new Point(0, 0);
