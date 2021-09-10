import React from "react";
import PropTypes from "prop-types";

const RowIndicator = ({ row, label }) => {
  return (
    <th className="Spreadsheet__rowheader">
      {label !== undefined ? label : "Label " + (row + 1)}
    </th>
  );
};

RowIndicator.propTypes = {
  row: PropTypes.number,
  label: PropTypes.string,
};

export default RowIndicator;
