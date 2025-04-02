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
                .select('tweet_text, disaster_type, location, severity_score, timestamp')
                .eq('genuine_disaster', true) // Only fetch tweets where genuine_disaster is TRUE
                .order('timestamp', {ascending: false});

            if (error) {
                console.error('Error fetching tweets:', error);
                setTweets(null);
            } else {
                console.log('Fetched data:', data);
                setTweets(data);
            }
        };

        fetchTweets();
    }, []);

    const severityRanges = [
        {label: '0.0-3.99', min: 0.0, max: 3.99, className: 'low'},
        {label: '4.0-6.99', min: 4.0, max: 6.99, className: 'moderate'},
        {label: '7.0-10.0', min: 7.0, max: 10.0, className: 'high'},
    ];

    const filteredTweets = tweets.filter((tweet) => {
        const matchesDisaster = selectedDisaster === null || tweet.disaster_type.toLowerCase() === selectedDisaster.toLowerCase();
        const matchesSeverity = selectedSeverityRange === null ||
            (Number(tweet.severity_score) >= selectedSeverityRange.min && Number(tweet.severity_score) <= selectedSeverityRange.max);
        const matchesCity = selectedCity === '' || tweet.location.toLowerCase().includes(selectedCity.toLowerCase());

        return matchesDisaster && matchesSeverity && matchesCity;
    });

    const resetFilters = () => {
        setSelectedDisaster(null);
        setSelectedSeverityRange(null);
        setSelectedCity('');
    };

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
                <div className="tweet-button-text">Post to your community</div>
            </button>

            <div className="filter-container">
                <div className="filter-section">
                    <label htmlFor="disasterFilter">Disaster Type</label>
                    <select
                        id="disasterFilter"
                        value={selectedDisaster !== null ? selectedDisaster : ''}
                        onChange={(e) => setSelectedDisaster(e.target.value || null)}
                    >
                        <option value="">Select</option>
                        {[...new Set(tweets.map(tweet => tweet.disaster_type.toLowerCase()))] // Getting unique disaster types in lowercase
                            .map(disasterType => (
                                <option key={disasterType} value={disasterType}>{disasterType}</option>))}
                    </select>
                </div>

                <div className="filter-section">
                    <label htmlFor="severityFilter">Severity Score</label>
                    <select
                        id="severityFilter"
                        value={selectedSeverityRange !== null ? selectedSeverityRange.label : ''}
                        onChange={(e) => {
                            const selectedRange = severityRanges.find(range => range.label === e.target.value);
                            setSelectedSeverityRange(selectedRange || null);
                        }}
                    >
                        <option value="">Select</option>
                        {severityRanges.map(range => (
                            <option key={range.label} value={range.label}>{range.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-section">
                    <label htmlFor="cityFilter">Location</label>
                    <input
                        id="cityFilter"
                        type="text"
                        placeholder="e.g., Houston"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    />
                </div>

                <button className="reset-button" onClick={resetFilters}>Reset Filters</button>
            </div>

            <div className="tweet-cards">
                {filteredTweets.length > 0 ? (filteredTweets.map((tweet, index) => {
                    const severityClass = severityRanges.find(range =>
                        Number(tweet.severity_score) >= range.min && Number(tweet.severity_score) <= range.max
                    )?.className || 'unknown';

                    return (
                        <div key={index} className={`tweet-card tweet-severity-${severityClass}`}>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt="BlueSky Logo"
                            />
                            <p className="tweet-content">{tweet.tweet_text}</p>
                            <p className="tweet-info">
                                <span className="tweet-location">{tweet.location}</span> - {tweet.disaster_type}
                                <span className="tweet-severity"> (Score: {tweet.severity_score})</span>
                                <br/>
                                <span
                                    className="tweet-timestamp"> Last updated: {tweet.timestamp ? new Date(tweet.timestamp).toLocaleString() : 'Unknown'}</span>
                            </p>
                        </div>
                    );
                })) : (<p className="no-tweets">No tweets match the selected filters.</p>)}
            </div>
        </div>
    );
};