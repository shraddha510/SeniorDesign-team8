import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import React from 'react';
import Home from './components/Home';
import './styles/App.css';
import TweetTable from "./components/TweetTable";
import HelpRequestForm from './components/HelpRequestForm';
import {RecentWatch} from "./components/RecentWatch";
import DisasterMap from "./components/DisasterMap";
import FirstResponderDashboard from './components/FirstResponderDashboard';
import FirstResponderLogin from './components/FirstResponderLogin';
import {HelpRequestProvider} from './context/HelpRequestContext';
import Analytics from "./components/Analytics";
import Layout from './components/Layout';

const App = () => {
    return (
        <HelpRequestProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={
                            <>
                                <Home/>
                                <div className="content-wrapper">
                                    <DisasterMap/>
                                    <TweetTable/>
                                </div>
                                <RecentWatch/>
                            </>
                        }/>
                        <Route path="/help-request" element={<div className="content-wrapper"><HelpRequestForm/></div>}/>
                        <Route path="/first-responder" element={<div className="content-wrapper"><FirstResponderDashboard/></div>}/>
                        <Route path="/first-responder-login" element={<div className="content-wrapper"><FirstResponderLogin/></div>}/>
                        <Route path="/analytics" element={<div className="content-wrapper"><Analytics/></div>}/>
                    </Routes>
                </Layout>
            </Router>
        </HelpRequestProvider>
    );
};

export default App;