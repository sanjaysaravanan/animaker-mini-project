import * as React from "react";

const ColumnIndicator = ({ column, label }) => {
  return (
    <th className="Spreadsheet__colheader">
      {label !== undefined ? label : "Head " + (column + 1)}
    </th>
  );
};

export default ColumnIndicator;
