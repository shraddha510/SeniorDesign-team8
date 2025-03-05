import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import './styles/App.css';
import TweetTable from "./components/TweetTable";
import HelpRequestForm from './components/HelpRequestForm';
import {RecentWatch} from "./components/RecentWatch";

const App = () => {
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
                    }/>
                    <Route path="/help-request" element={<HelpRequestForm/>}/>
                </Routes>
            </div>
        </Router>
    );
};

export default App;