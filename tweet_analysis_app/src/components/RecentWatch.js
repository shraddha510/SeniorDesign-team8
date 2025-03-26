import React, {useState, useEffect} from 'react';
import '../styles/RecentWatch.css';
import {supabase} from '../supabase.js';

export const RecentWatch = ({className}) => {
    const [tweets, setTweets] = useState([]);
    const [selectedDisaster, setSelectedDisaster] = useState(null);
    const [selectedSeverityRange, setSelectedSeverityRange] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');

    useEffect(() => {
        const fetchTweets = async () => {
            const {data, error} = await supabase
                .from('gen_ai_output')
                .select('tweet_text, disaster_type, location, severity_score')
                .eq('genuine_disaster', true) // Only fetch tweets where genuine_disaster is TRUE
                .order('timestamp', {ascending: false});

            if (error) {
                console.error('Error fetching tweets:', error);
                setTweets(null)
            } else {
                console.log('Fetched data:', data);
                setTweets(data);
            }
        };

        fetchTweets();
    }, []);

    const severityRanges = [
        {label: '0.0-0.99', min: 0.0, max: 0.99},
        {label: '1.0-1.99', min: 1.0, max: 1.99},
        {label: '2.0-2.99', min: 2.0, max: 2.99},
        {label: '3.0-3.99', min: 3.0, max: 3.99},
        {label: '4.0-4.99', min: 4.0, max: 4.99},
        {label: '5.0-5.99', min: 5.0, max: 5.99},
        {label: '6.0-6.99', min: 6.0, max: 6.99},
        {label: '7.0-7.99', min: 7.0, max: 7.99},
        {label: '8.0-8.99', min: 8.0, max: 8.99},
        {label: '9.0-9.99', min: 9.0, max: 9.99},
        {label: '10.0', min: 10.0, max: 10.0},
    ];

    const filteredTweets = tweets.filter((tweet) => {
        const matchesDisaster = selectedDisaster === null || tweet.disaster_type.toLowerCase() === selectedDisaster.toLowerCase();
        const matchesSeverity = selectedSeverityRange === null ||
            (Number(tweet.severity_score) >= selectedSeverityRange.min && Number(tweet.severity_score) <= selectedSeverityRange.max);
        const matchesCity = selectedCity === '' || tweet.location.toLowerCase().includes(selectedCity.toLowerCase());

        return matchesDisaster && matchesSeverity && matchesCity;
    });

    return (
        <div className={"recent-watch " + (className || "")}>
            <div className="title">Recent Watch</div>
            <div className="description">Stay up to date on the latest disaster news.</div>

            <button
                className="tweet-button"
                onClick={() => window.open("https://bsky.app/")}
            >
                <img
                    className="bluesky-logo"
                    src="/bluesky_logo.png"
                    alt={"bluesky logo mini"}/>
                <div className="post-button-text">Post to your community</div>
            </button>

            <div className="filter-container">
                <div className="filter-section">
                    <label htmlFor="disasterFilter">Disaster Type:</label>
                    <select
                        id="disasterFilter"
                        value={selectedDisaster !== null ? selectedDisaster : ''}
                        onChange={(e) => setSelectedDisaster(e.target.value || null)}
                    >
                        <option value="">Select a disaster type</option>
                        {[...new Set(tweets.map(tweet => tweet.disaster_type.toLowerCase()))] // Getting unique disaster types in lowercase
                            .map(disasterType => (
                                <option key={disasterType} value={disasterType}>{disasterType}</option>))}
                    </select>
                </div>

                <div className="filter-section">
                    <label htmlFor="severityFilter">Severity Score:</label>
                    <select
                        id="severityFilter"
                        value={selectedSeverityRange !== null ? selectedSeverityRange.label : ''}
                        onChange={(e) => {
                            const selectedRange = severityRanges.find(range => range.label === e.target.value);
                            setSelectedSeverityRange(selectedRange || null);
                        }}
                    >
                        <option value="">Select a severity score range</option>
                        {severityRanges.map(range => (
                            <option key={range.label} value={range.label}>{range.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-section">
                    <label htmlFor="cityFilter">City, State:</label>
                    <input
                        id="cityFilter"
                        type="text"
                        placeholder="Location (e.g., Los Angeles)"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    />
                </div>
            </div>

            <div className="tweet-cards">
                {filteredTweets.length > 0 ? (filteredTweets.map((tweet, index) => (
                    <div key={index} className={`tweet-card tweet-severity-${tweet.severity_score}`}>
                        <img
                            className="bluesky-logo"
                            src="/bluesky_logo.png"
                            alt="BlueSky Logo"
                        />

                        <p className="tweet-content">{tweet.tweet_text}</p>
                        <p className="tweet-info">
                            <span className="tweet-location">{tweet.location}</span> - {tweet.disaster_type}
                            <span className="tweet-severity"> (Score: {tweet.severity_score})</span>
                        </p>
                    </div>
                ))) : (<p className="no-tweets">No tweets match the selected filters.</p>)}
            </div>
        </div>
    );
};