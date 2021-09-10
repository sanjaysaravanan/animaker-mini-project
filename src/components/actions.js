import * as PointSet from "./point-set";
import * as PointMap from "./point-map";
import * as PointRange from "./point-range";
import * as Matrix from "./matrix";
import { isActive, normalizeSelected } from "./util";

export const setData = (state, data) => {
  const nextActive =
    state.active && Matrix.has(state.active, data) ? state.active : null;
  const nextSelected = normalizeSelected(state.selected, data);
  const nextBindings = PointMap.map(
    (bindings) => PointSet.filter((point) => Matrix.has(point, data), bindings),
    PointMap.filter((_, point) => Matrix.has(point, data), state.bindings)
  );
  return {
    data,
    active: nextActive,
    selected: nextSelected,
    bindings: nextBindings,
  };
};

export const select = (state, point) => {
  if (state.active && !isActive(state.active, point)) {
    return {
      selected: PointRange.create(point, state.active),
      mode: "view",
    };
  }
  return null;
};

export const activate = (state, point) => ({
  selected: PointRange.create(point, point),
  active: point,
  mode: isActive(state.active, point) ? "edit" : "view",
});

export function setCellData(state, active, cellData, bindings) {
  if (isActiveReadOnly(state)) {
    return null;
  }
  return {
    mode: "edit",
    data: Matrix.set(active, cellData, state.data),
    lastChanged: active,
    bindings: PointMap.set(active, PointSet.from(bindings), state.bindings),
  };
}

export function setCellDimensions(state, point, dimensions) {
  const prevRowDimensions = state.rowDimensions[point.row];
  const prevColumnDimensions = state.columnDimensions[point.column];
  if (
    prevRowDimensions &&
    prevColumnDimensions &&
    prevRowDimensions.top === dimensions.top &&
    prevRowDimensions.height === dimensions.height &&
    prevColumnDimensions.left === dimensions.left &&
    prevColumnDimensions.width === dimensions.width
  ) {
    return null;
  }
  return {
    rowDimensions: {
      ...state.rowDimensions,
      [point.row]: { top: dimensions.top, height: dimensions.height },
    },
    columnDimensions: {
      ...state.columnDimensions,
      [point.column]: { left: dimensions.left, width: dimensions.width },
    },
  };
}

export function copy(state) {
  const selectedPoints = state.selected
    ? Array.from(PointRange.iterate(state.selected))
    : [];
  return {
    copied: selectedPoints.reduce((acc, point) => {
      const value = Matrix.get(point, state.data);
      return value === undefined ? acc : PointMap.set(point, value, acc);
    }, PointMap.from),
    cut: false,
    hasPasted: false,
  };
}

export function cut(state) {
  return {
    ...copy(state),
    cut: true,
  };
}

export function addRow(state) {
  const { rows, columns } = Matrix.getSize(state.data);
  const requiredRows = rows + 1;
  const paddedData = Matrix.padRows(state.data, requiredRows, columns);
  return {
    ...state,
    data: paddedData,
  };
}

export function addColumn(state) {
  const { rows, columns } = Matrix.getSize(state.data);
  const requiredColumns = columns + 1;
  const paddedData = Matrix.padRows(state.data, rows, requiredColumns);
  return {
    ...state,
    data: paddedData,
  };
}

export async function paste(state, text) {
  const { active } = state;
  if (!active) {
    return null;
  }
  const copiedMatrix = Matrix.split(text, (value) => ({ value }));
  const copied = PointMap.fromMatrix(copiedMatrix);

  const minPoint = PointSet.min(copied);

  const copiedSize = Matrix.getSize(copiedMatrix);
  const requiredRows = active.row + copiedSize.rows;
  const requiredColumns = active.column + copiedSize.columns;
  const paddedData = Matrix.padRows(state.data, requiredRows, requiredColumns);

  const { data, commit } = PointMap.reduce(
    (acc, value, point) => {
      let commit = acc.commit || [];
      const nextPoint = {
        row: point.row - minPoint.row + active.row,
        column: point.column - minPoint.column + active.column,
      };

      const nextData = state.cut ? Matrix.unset(point, acc.data) : acc.data;

      if (state.cut) {
        commit = [...commit, { prevCell: value, nextCell: null }];
      }

      if (!Matrix.has(nextPoint, paddedData)) {
        return { data: nextData, commit };
      }

      const currentValue = Matrix.get(nextPoint, nextData) || null;

      commit = [
        ...commit,
        {
          prevCell: currentValue,
          nextCell: value,
        },
      ];

      return {
        data: Matrix.set(nextPoint, { ...currentValue, ...value }, nextData),
        commit,
      };
    },
    copied,
    { data: paddedData, commit: [] }
  );
  return {
    data,
    selected: PointRange.create(active, {
      row: active.row + copiedSize.rows - 1,
      column: active.column + copiedSize.columns - 1,
    }),
    cut: false,
    hasPasted: true,
    mode: "view",
    lastCommit: commit,
  };
}

export const edit = (state) => {
  if (isActiveReadOnly(state)) {
    return null;
  }
  return { mode: "edit" };
};

export const view = () => ({
  mode: "view",
});

export const clear = (state) => {
  if (!state.active) {
    return null;
  }
  const selectedPoints = state.selected
    ? Array.from(PointRange.iterate(state.selected))
    : [];
  const changes = selectedPoints.map((point) => {
    const cell = Matrix.get(point, state.data);
    return {
      prevCell: cell || null,
      nextCell: null,
    };
  });
  return {
    data: selectedPoints.reduce(
      (acc, point) => Matrix.set(point, undefined, acc),
      state.data
    ),
    ...commit(state, changes),
  };
};

export const go = (rowDelta, columnDelta) => (state) => {
  if (!state.active) {
    return null;
  }
  const nextActive = {
    row: state.active.row + rowDelta,
    column: state.active.column + columnDelta,
  };
  if (!Matrix.has(nextActive, state.data)) {
    return { mode: "view" };
  }
  return {
    active: nextActive,
    selected: PointRange.create(nextActive, nextActive),
    mode: "view",
  };
};

export const modifyEdge = (edge) => (state) => {
  const { active, selected } = state;

  if (!active || !selected) {
    return null;
  }

  const field = edge === "Left" || edge === "Right" ? "column" : "row";

  const key = edge === "Left" || edge === "Top" ? "start" : "end";
  const delta = key === "start" ? -1 : 1;

  const edgeOffsets = PointRange.has(selected, {
    ...active,
    [field]: active[field] + delta * -1,
  });

  const keyToModify = edgeOffsets ? (key === "start" ? "end" : "start") : key;

  const nextSelected = {
    ...selected,
    [keyToModify]: {
      ...selected[keyToModify],
      [field]: selected[keyToModify][field] + delta,
    },
  };

  return {
    selected: normalizeSelected(nextSelected, state.data),
  };
};

export const blur = () => ({
  active: null,
});

// Key Bindings

const keyDownHandlers = {
  ArrowUp: go(-1, 0),
  ArrowDown: go(+1, 0),
  ArrowLeft: go(0, -1),
  ArrowRight: go(0, +1),
  Tab: go(0, +1),
  Enter: edit,
  Backspace: clear,
  Escape: blur,
};

const editKeyDownHandlers = {
  Escape: view,
  Tab: keyDownHandlers.Tab,
  Enter: keyDownHandlers.ArrowDown,
};

const editShiftKeyDownHandlers = {
  Tab: go(0, -1),
};

const shiftKeyDownHandlers = {
  ArrowUp: modifyEdge("Top"),
  ArrowDown: modifyEdge("Down"),
  ArrowLeft: modifyEdge("Left"),
  ArrowRight: modifyEdge("Right"),
  Tab: go(0, -1),
};

const shiftMetaKeyDownHandlers = {};
const metaKeyDownHandlers = {};

function getActive(state) {
  const activeCell = state.active && Matrix.get(state.active, state.data);
  return activeCell || null;
}

const isActiveReadOnly = (state) => {
  const activeCell = getActive(state);
  return Boolean(activeCell && activeCell.readOnly);
};

export function keyPress(state, event) {
  if (isActiveReadOnly(state) || event.metaKey) {
    return null;
  }
  if (state.mode === "view" && state.active) {
    return { mode: "edit" };
  }
  return null;
}

export function getKeyDownHandler(state, event) {
  const { key } = event;
  let handlers;
  // Order matters
  if (state.mode === "edit") {
    if (event.shiftKey) {
      handlers = editShiftKeyDownHandlers;
    } else {
      handlers = editKeyDownHandlers;
    }
  } else if (event.shiftKey && event.metaKey) {
    handlers = shiftMetaKeyDownHandlers;
  } else if (event.shiftKey) {
    handlers = shiftKeyDownHandlers;
  } else if (event.metaKey) {
    handlers = metaKeyDownHandlers;
  } else {
    handlers = keyDownHandlers;
  }

  return handlers[key];
}

export function keyDown(state, event) {
  const handler = getKeyDownHandler(state, event);
  if (handler) {
    return handler(state, event);
  }
  return null;
}

export function dragStart(state) {
  return { dragging: true };
}

export function dragEnd(state) {
  return { dragging: false };
}

export function commit(state, changes) {
  return { lastCommit: changes };
}
