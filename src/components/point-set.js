import * as PointMap from "./point-map";
import * as PointRange from "./point-range";
/** Returns a boolean asserting whether an point is present with the given value in the Set object or not */
export const has = (set, point) => {
  return PointMap.has(point, set);
};

/** Returns the number of points in a PointSet object */
export const size = (set) => PointMap.size(set);

/** Creates a new set with all points that pass the test implemented by the provided function */
export const filter = (func, set) => {
  return PointMap.filter((_, point) => func(point), set);
};

const minKey = (object) => {
  return Math.min(...Object.keys(object));
};

/** Returns the point on the minimal row in the minimal column in the set */
export const min = (set) => {
  const row = minKey(set);
  return { row, column: minKey(set[row]) };
};

const maxKey = (object) => Math.max(...Object.keys(object));

/** Returns the point on the maximal row in the maximal column in the set */
export const max = (set) => {
  const row = maxKey(set);
  return { row, column: maxKey(set[row]) };
};

/** Creates a new PointSet instance from an array-like or iterable object */
export const from = (points) => {
  return points.reduce(
    (acc, point) => PointMap.set(point, true, acc),
    PointMap.from
  );
};

/** Transform a point set to a range */
export const toRange = (set) => {
  const start = min(set);
  const end = max(set);
  return PointRange.create(start, end);
};
