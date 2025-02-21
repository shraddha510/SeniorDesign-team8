import React from "react";
import { useEffect, useState } from "react";
import Papa from "papaparse";


const App = () => {
  const [csvData, setCsvData] = useState([]);
  const [jsonData, setJsonData] = useState([]);

  useEffect(() => {
    // Load CSV or TSV File
    fetch("/bluesky_disaster_data.csv") // Change to '/data.tsv' if needed
      .then(response => response.text())
      .then(text => {
        Papa.parse(text, {
          header: true, // Reads first row as keys
          delimiter: ",", // Change to '\t' for TSV
          complete: (result) => {
            setCsvData(result.data);
          },
        });
      });

    // Load JSON File
    fetch("/bluesky_raw_data.json")
      .then(response => response.json())
      .then(data => setJsonData(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Data Viewer</h1>

      <h2>CSV/TSV Data:</h2>
      <pre>{JSON.stringify(csvData, null, 2)}</pre>

      <h2>JSON Data:</h2>
      <pre>{JSON.stringify(jsonData, null, 2)}</pre>
    </div>
  );
};

export default App;
