import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Papa from 'papaparse';
import Navbar from './components/Navbar';
import Home from './components/Home';
import './styles/App.css';
import TweetTable from "./components/TweetTable";
import HelpRequestForm from './components/HelpRequestForm';
import {RecentWatch} from "./components/RecentWatch";

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
        <Router>
            <div className="app-container">
                <Navbar/>
                <Routes>
                    <Route path="/" element={
                        <>
                            <Home/>
                            <TweetTable filePath="/json/bluesky_raw_data_02-26-2025.json"/>
                            <RecentWatch/>
                        </>
                    } />
                    <Route path="/help-request" element={<HelpRequestForm />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;