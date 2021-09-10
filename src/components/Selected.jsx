import * as React from "react";
import { connect } from "unistore/react";
import FloatingRect from "./FloatingReact";
import * as PointRange from "./point-range";
import { getRangeDimensions } from "./util";

const Selected = (props) => <FloatingRect {...props} variant="selected" />;

export default connect((state) => {
  const dimensions =
    state.selected && getRangeDimensions(state, state.selected);
  return {
    dimensions,
    hidden:
      !state.selected ||
      Boolean(state.selected && PointRange.size(state.selected) === 1),
    dragging: state.dragging,
  };
})(Selected);
