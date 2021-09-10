import * as React from "react";
import { connect } from "unistore/react";
import * as PointSet from "./point-set";
import * as PointMap from "./point-map";
import { getRangeDimensions } from "./util";
import FloatingRect from "./FloatingReact";

const Copied = (props) => <FloatingRect {...props} variant="copied" />;

export default connect((state) => {
  const cells = state.hasPasted
    ? PointSet.from([])
    : PointMap.map(() => true, state.copied);
  const hidden = PointSet.size(cells) === 0;
  return {
    dimensions: hidden
      ? null
      : getRangeDimensions(state, PointSet.toRange(cells)),
    hidden,
    dragging: false,
  };
})(Copied);
