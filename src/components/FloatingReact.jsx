import * as React from "react";
import classnames from "classnames";

const FloatingRect = ({ dimensions, dragging, hidden, variant }) => {
  const { width, height, top, left } = dimensions || {};
  return (
    <div
      className={classnames("Spreadsheet__floating-rect", {
        [`Spreadsheet__floating-rect--${variant}`]: variant,
        "Spreadsheet__floating-rect--dragging": dragging,
        "Spreadsheet__floating-rect--hidden": hidden,
      })}
      style={{ width, height, top, left }}
    />
  );
};

export default FloatingRect;
