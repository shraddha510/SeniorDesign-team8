import React, {useEffect, useState} from 'react';
import Papa from 'papaparse';
import Navbar from './components/Navbar';
import Home from './components/Home';
import './styles/App.css';
import TweetTable from "./components/TweetTable";

const App = () => {
    const [csvData, setCsvData] = useState([]);

    useEffect(() => {
        fetch('/bluesky_disaster_data.csv')
            .then(response => response.text())
            .then(text => {
                Papa.parse(text, {
                    header: true,
                    delimiter: ',',
                    complete: (result) => {
                        setCsvData(result.data);
                    },
                });
            });
    }, []);

    return (
        <div className="app-container">
            <Navbar/>
            <Home/>
            <TweetTable filePath="/json/bluesky_raw_data_02-26-2025.json"/>
        </div>
    );
};

export default App;