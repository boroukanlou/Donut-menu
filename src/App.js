import React from "react";
import DonutMenu from "./DonutMenu";
import "./App.css";
import mockData from "./mockData";

function App() {
  return (
    <div className="App">
      <DonutMenu data={mockData} />
    </div>
  );
}

export default App;
