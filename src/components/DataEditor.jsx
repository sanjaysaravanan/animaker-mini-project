import * as React from "react";
import { moveCursorToEnd } from "./util";

/** The default Spreadsheet DataEditor component */
const DataEditor = ({
  onChange,
  cell = {
    value: "",
  },
}) => {
  const inputRef = React.useRef(null);

  const handleChange = React.useCallback(
    (e) => {
      onChange({ ...cell, value: e.target.value });
    },
    [onChange, cell]
  );

  React.useEffect(() => {
    if (inputRef.current) {
      moveCursorToEnd(inputRef.current);
    }
  }, [inputRef]);

  const value = cell?.value || "";

  return (
    <div className="Spreadsheet__data-editor">
      <input
        ref={inputRef}
        type="text"
        onChange={handleChange}
        value={value}
        autoFocus
      />
    </div>
  );
};

export default DataEditor;
