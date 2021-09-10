import * as React from "react";

import createStore from "unistore";
import devtools from "unistore/devtools";
import { Provider } from "unistore/react";
import * as PointRange from "./point-range";
import * as Actions from "./actions";
import * as PointMap from "./point-map";
import * as Matrix from "./matrix";
import { Parser as FormulaParser } from "hot-formula-parser";
import classNames from "classnames";

import DefaultTable from "./Table";
import DefaultRow from "./Row";
import DefaultCornerIndicator from "./CornerIndicator";
import DefaultColumnIndicator from "./ColumnIndicator";
import DefaultRowIndicator from "./RowIndicator";
import { Cell as DefaultCell, enhance as enhanceCell } from "./Cell";
import DefaultDataViewer from "./DataViewer";
import DefaultDataEditor from "./DataEditor";
import ActiveCell from "./ActiveCell";
import Selected from "./Selected";
import Copied from "./Copied";
import { getBindingsForCell as defaultGetBindingsForCell } from "./bindings";
import {
  range,
  readTextFromClipboard,
  writeTextToClipboard,
  getComputedValue,
  getSelectedCSV,
  calculateSpreadsheetSize,
} from "./util";
import "./SpreadSheet.css";
import AddCell from "./AddCell";

const INITIAL_STATE = {
  active: null,
  mode: "view",
  rowDimensions: {},
  columnDimensions: {},
  lastChanged: null,
  hasPasted: false,
  cut: false,
  dragging: false,
};

/**
 * The Spreadsheet component
 */
const SpreadSheet = (props) => {
  const {
    className,
    columnLabels,
    rowLabels,
    hideColumnIndicators,
    hideRowIndicators,
    onKeyDown,
    Table = DefaultTable,
    Row = DefaultRow,
    CornerIndicator = DefaultCornerIndicator,
    DataEditor = DefaultDataEditor,
    DataViewer = DefaultDataViewer,
    getBindingsForCell = defaultGetBindingsForCell,
    RowIndicator = DefaultRowIndicator,
    ColumnIndicator = DefaultColumnIndicator,
    onChange = () => {},
    onModeChange = () => {},
    onSelect = () => {},
    onActivate = () => {},
    onCellCommit = () => {},
  } = props;

  // The size of data, synced with store state
  const [size, setSize] = React.useState(
    calculateSpreadsheetSize(props.data, rowLabels, columnLabels)
  );
  // The spreadsheet mode, synced with store state
  const [mode, setMode] = React.useState(INITIAL_STATE.mode);

  const rootRef = React.useRef(null);
  const prevStateRef = React.useRef({
    ...INITIAL_STATE,
    data: props.data,
    selected: null,
    copied: PointMap.from([]),
    bindings: PointMap.from([]),
    lastCommit: null,
  });

  const store = React.useMemo(() => {
    const prevState = prevStateRef.current;
    return devtools(createStore(prevState));
  }, []);

  const copy = React.useMemo(() => store.action(Actions.copy), [store]);
  const cut = React.useMemo(() => store.action(Actions.cut), [store]);
  const paste = React.useMemo(() => store.action(Actions.paste), [store]);
  const addRow = React.useMemo(() => store.action(Actions.addRow), [store]);
  const addColumn = React.useMemo(
    () => store.action(Actions.addColumn),
    [store]
  );
  const onKeyDownAction = React.useMemo(
    () => store.action(Actions.keyDown),
    [store]
  );
  const onKeyPress = React.useMemo(
    () => store.action(Actions.keyPress),
    [store]
  );
  const onDragStart = React.useMemo(
    () => store.action(Actions.dragStart),
    [store]
  );
  const onDragEnd = React.useMemo(() => store.action(Actions.dragEnd), [store]);
  const setData = React.useMemo(() => store.action(Actions.setData), [store]);

  const handleStoreChange = React.useCallback(
    (state) => {
      const prevState = prevStateRef.current;

      if (state.lastCommit && state.lastCommit !== prevState.lastCommit) {
        for (const change of state.lastCommit) {
          onCellCommit(change.prevCell, change.nextCell, state.active);
        }
      }

      if (state.data !== prevState.data) {
        // Sync local size state with store state
        const nextSize = calculateSpreadsheetSize(
          state.data,
          rowLabels,
          columnLabels
        );
        setSize((prevSize) =>
          prevSize.columns === nextSize.columns &&
          prevSize.rows === nextSize.rows
            ? prevSize
            : nextSize
        );

        // Call on change only if the data change internal
        if (state.data !== props.data) {
          onChange(state.data);
        }
      }

      if (state.mode !== prevState.mode) {
        onModeChange(state.mode);
        // Sync local mode state with store state
        setMode(state.mode);
      }

      if (state.selected !== prevState.selected) {
        const points = state.selected
          ? Array.from(PointRange.iterate(state.selected))
          : [];
        onSelect(points);
      }

      if (state.active !== prevState.active && state.active) {
        onActivate(state.active);
      }

      prevStateRef.current = state;
    },
    [
      onActivate,
      onCellCommit,
      onChange,
      onModeChange,
      onSelect,
      rowLabels,
      columnLabels,
      props.data,
    ]
  );

  React.useEffect(() => {
    const unsubscribe = store.subscribe(handleStoreChange);
    return unsubscribe;
  }, [store, handleStoreChange]);

  React.useEffect(() => {
    const prevState = prevStateRef.current;
    if (props.data !== prevState.data) {
      setData(props.data);
    }
  }, [props.data, setData]);

  const clip = React.useCallback(
    (event) => {
      const { data, selected } = store.getState();
      const csv = getSelectedCSV(selected, data);
      writeTextToClipboard(event, csv);
    },
    [store]
  );

  const isFocused = React.useCallback(() => {
    const root = rootRef.current;
    const { activeElement } = document;

    return mode === "view" && root
      ? root === activeElement || root.contains(activeElement)
      : false;
  }, [rootRef, mode]);

  const handleCut = React.useCallback(
    (event) => {
      if (isFocused()) {
        event.preventDefault();
        event.stopPropagation();
        clip(event);
        cut();
      }
    },
    [isFocused, clip, cut]
  );

  const handleCopy = React.useCallback(
    (event) => {
      if (isFocused()) {
        event.preventDefault();
        event.stopPropagation();
        clip(event);
        copy();
      }
    },
    [isFocused, clip, copy]
  );

  const handlePaste = React.useCallback(
    async (event) => {
      if (mode === "view" && isFocused()) {
        event.preventDefault();
        event.stopPropagation();
        if (event.clipboardData) {
          const text = readTextFromClipboard(event);
          paste(text);
        }
      }
    },
    [mode, isFocused, paste]
  );

  const handleKeyDown = React.useCallback(
    (event) => {
      if (onKeyDown) {
        onKeyDown(event);
      }
      // Do not use event in case preventDefault() was called inside onKeyDown
      if (!event.defaultPrevented) {
        // Only disable default behavior if an handler exist
        if (Actions.getKeyDownHandler(store.getState(), event)) {
          event.nativeEvent.preventDefault();
        }
        onKeyDownAction(event);
      }
    },
    [store, onKeyDown, onKeyDownAction]
  );

  const handleMouseUp = React.useCallback(() => {
    onDragEnd();
    document.removeEventListener("mouseup", handleMouseUp);
  }, [onDragEnd]);

  const handleMouseMove = React.useCallback(
    (event) => {
      if (!store.getState().dragging && event.buttons === 1) {
        onDragStart();
        document.addEventListener("mouseup", handleMouseUp);
      }
    },
    [store, onDragStart, handleMouseUp]
  );

  const formulaParser = React.useMemo(() => {
    return props.formulaParser || new FormulaParser();
  }, [props.formulaParser]);

  const Cell = React.useMemo(() => {
    return enhanceCell(props.Cell || DefaultCell);
  }, [props.Cell]);

  React.useEffect(() => {
    document.addEventListener("cut", handleCut);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleCut, handleCopy, handlePaste]);

  React.useEffect(() => {
    formulaParser.on("callCellValue", (cellCoord, done) => {
      let value;
      try {
        const point = {
          row: cellCoord.row.index,
          column: cellCoord.column.index,
        };
        const cell = Matrix.get(point, store.getState().data);
        value = getComputedValue({
          cell,
          formulaParser: formulaParser,
        });
      } catch (error) {
        console.error(error);
      } finally {
        done(value);
      }
    });
    formulaParser.on("callRangeValue", (startCellCoord, endCellCoord, done) => {
      const startPoint = {
        row: startCellCoord.row.index,
        column: startCellCoord.column.index,
      };
      const endPoint = {
        row: endCellCoord.row.index,
        column: endCellCoord.column.index,
      };
      const values = Matrix.toArray(
        Matrix.slice(startPoint, endPoint, store.getState().data),
        (cell) =>
          getComputedValue({
            cell,
            formulaParser: formulaParser,
          })
      );

      done(values);
    });
  }, [formulaParser, store, handleCut, handleCopy, handlePaste]);

  return (
    <Provider store={store}>
      <div style={{ display: "flex", justifyContent: "start" }}>
        <div
          ref={rootRef}
          className={classNames("Spreadsheet", className)}
          onKeyPress={onKeyPress}
          onKeyDown={handleKeyDown}
          onMouseMove={handleMouseMove}
        >
          <Table
            columns={size.columns}
            hideColumnIndicators={hideColumnIndicators}
          >
            <Row>
              {!hideRowIndicators && !hideColumnIndicators && (
                <CornerIndicator />
              )}
              {!hideColumnIndicators &&
                range(size.columns).map((columnNumber) =>
                  columnLabels ? (
                    <ColumnIndicator
                      key={columnNumber}
                      column={columnNumber}
                      label={
                        columnNumber in columnLabels
                          ? columnLabels[columnNumber]
                          : null
                      }
                    />
                  ) : (
                    <ColumnIndicator key={columnNumber} column={columnNumber} />
                  )
                )}
            </Row>
            {range(size.rows).map((rowNumber) => (
              <Row key={rowNumber}>
                {!hideRowIndicators &&
                  (rowLabels ? (
                    <RowIndicator
                      key={rowNumber}
                      row={rowNumber}
                      label={
                        rowNumber in rowLabels ? rowLabels[rowNumber] : null
                      }
                    />
                  ) : (
                    <RowIndicator key={rowNumber} row={rowNumber} />
                  ))}
                {range(size.columns).map((columnNumber) => (
                  <Cell
                    key={columnNumber}
                    row={rowNumber}
                    column={columnNumber}
                    DataViewer={DataViewer}
                    formulaParser={formulaParser}
                  />
                ))}
              </Row>
            ))}
          </Table>
          <ActiveCell
            DataEditor={DataEditor}
            getBindingsForCell={getBindingsForCell}
          />
          <Selected />
          <Copied />
          <AddCell type="Row" onClick={addRow} />
        </div>
        <AddCell type="Column" onClick={addColumn} />
      </div>
    </Provider>
  );
};

export default SpreadSheet;
