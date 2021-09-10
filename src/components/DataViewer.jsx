import * as React from "react";
import { getComputedValue } from "./util";

const toView = (value) => {
  if (value === false) {
    return <span className="Spreadsheet__data-viewer--boolean">FALSE</span>;
  }
  if (value === true) {
    return <span className="Spreadsheet__data-viewer--boolean">TRUE</span>;
  }
  return <span className="Spreadsheet__data-viewer">{value}</span>;
};

/** The default Spreadsheet DataViewer component */
const DataViewer = ({ cell, formulaParser }) => {
  return toView(getComputedValue({ cell, formulaParser }));
};

export default DataViewer;
