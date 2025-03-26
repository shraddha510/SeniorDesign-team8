import React, { useState, useEffect } from "react";
import {
    LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    CartesianGrid
} from "recharts";
import "../styles/Analytics.css";
import { useHelpRequests } from '../context/HelpRequestContext';

const COLORS = ["#FF6666", "#FFCC33", "#66CC66", "#6699FF"];

const Analytics = () => {
    const { helpRequests } = useHelpRequests();
    const [disasterTrends, setDisasterTrends] = useState([]);
    const [disasterTypes, setDisasterTypes] = useState([]);
    const [affectedLocations, setAffectedLocations] = useState([]);
    const [severityDistribution, setSeverityDistribution] = useState([]);
    const [emergencyStats, setEmergencyStats] = useState({
        totalRequests: 0,
        pending: 0,
        resolved: 0
    });

    useEffect(() => {
        // Calculate emergency stats from help requests
        const stats = {
            totalRequests: helpRequests.length,
            pending: helpRequests.filter(request => request.status === 'pending').length,
            resolved: helpRequests.filter(request => request.status === 'resolved').length
        };
        setEmergencyStats(stats);

        // Calculate disaster types distribution
        const types = {};
        helpRequests.forEach(request => {
            types[request.emergencyType] = (types[request.emergencyType] || 0) + 1;
        });
        setDisasterTypes(Object.entries(types).map(([name, value]) => ({ name, value })));

        // Calculate affected locations
        const locations = {};
        helpRequests.forEach(request => {
            locations[request.location] = (locations[request.location] || 0) + 1;
        });
        setAffectedLocations(Object.entries(locations)
            .map(([location, tweets]) => ({ location, tweets }))
            .sort((a, b) => b.tweets - a.tweets)
            .slice(0, 4));

        // Calculate severity distribution based on status
        const severityCounts = {
            'High': helpRequests.filter(request => request.status === 'pending').length,
            'Moderate': helpRequests.filter(request => request.status === 'in-progress').length,
            'Low': helpRequests.filter(request => request.status === 'resolved').length
        };
        setSeverityDistribution(Object.entries(severityCounts)
            .map(([severity, count]) => ({ severity, count })));

        // Calculate disaster trends over time (last 4 days)
        const today = new Date();
        const trends = [];
        for (let i = 3; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const count = helpRequests.filter(request => {
                const requestDate = new Date(request.timestamp);
                return requestDate.toDateString() === date.toDateString();
            }).length;
            trends.push({ date: dayStr, tweets: count });
        }
        setDisasterTrends(trends);
    }, [helpRequests]);

    return (
        <div className="analytics-container">
            <h1 class="title2">Disaster Analytics Dashboard</h1>

            {/* Emergency Requests */}
            <div className="summary-container">
                <h2>Emergency Request Statistics</h2>
                <div className="summary-box">
                    <div className="summary-item">
                        <p className="summary-label">Total Requests</p>
                        <p className="summary-value">{emergencyStats.totalRequests}</p>
                    </div>
                    <div className="summary-item">
                        <p className="summary-label">Pending Requests</p>
                        <p className="summary-value">{emergencyStats.pending}</p>
                    </div>
                    <div className="summary-item">
                        <p className="summary-label">Resolved Requests</p>
                        <p className="summary-value">{emergencyStats.resolved}</p>
                    </div>
                </div>
            </div>

            <div className="analytics-grid">
                {/* Disaster Trends Over Time */}
                <div className="chart-container">
                    <h2>Disaster Trends Over Time</h2>
                    <p className="chart-description">
                        This graph shows the number of disaster-related tweets over time, helping to track crisis frequency.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={disasterTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                label={{ value: "Date", position: "insideBottom", dy: 10 }} 
                            />
                            <YAxis 
                                label={{ value: "Tweet Volume", angle: -90, position: "insideCenter", dx: -25}} 
                            />
                            <Tooltip />
                            <Line type="monotone" dataKey="tweets" stroke="#2A5DB0" strokeWidth={2} name="" /> 
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Disaster Type Breakdown */}
                <div className="chart-container">
                    <h2>Disaster Type Breakdown</h2>
                    <p className="chart-description">
                        This pie chart displays the distribution of disaster types reported.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                        <Pie
                            data={disasterTypes}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            outerRadius={100}
                            label
                        >
                            {disasterTypes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                            <Legend />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Most Affected Locations */}
                <div className="chart-container">
                    <h2>Most Affected Locations</h2>
                    <p className="chart-description">
                        This chart ranks the most affected locations based on tweet volume.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={affectedLocations} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="location" type="category" />
                            <Tooltip />
                            <Bar dataKey="tweets">
                            {affectedLocations.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Severity Distribution */}
                <div className="chart-container">
                    <h2>Severity Distribution</h2>
                    <p className="chart-description">
                        This graph categorizes reported disasters based on severity.
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={severityDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="severity" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#007BFF" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;