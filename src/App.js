import "./App.css";

import Spreadsheet from "./components/SpreadSheet";

function App() {
  const data = [
    [{ value: "Sanjay" }, { value: "Sam" }],
    [undefined, undefined],
  ];

  return (
    <div className="App">
      <Spreadsheet data={data} />
    </div>
  );
}

export default App;
