import React, {useState, useEffect} from 'react';
import '../styles/RecentWatch.css';
import {supabase} from '../supabase.js';

export const RecentWatch = ({className}) => {
    const [tweets, setTweets] = useState([]);
    const [selectedDisaster, setSelectedDisaster] = useState(null);
    const [selectedSeverityRange, setSelectedSeverityRange] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [visibleTweetCount, setVisibleTweetCount] = useState(3);

    useEffect(() => {
        const fetchTweets = async () => {
            const {data, error} = await supabase
                .from('multiprocessing_gen_ai_output')
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
        {label: '0.0-3.99', min: 0.0, max: 3.99, className: 'low', displayName: 'Low'},
        {label: '4.0-6.99', min: 4.0, max: 6.99, className: 'moderate', displayName: 'Moderate'},
        {label: '7.0-8.99', min: 7.0, max: 8.99, className: 'high', displayName: 'High'},
        {label: '9.0-10.0', min: 9.0, max: 10.0, className: 'critical', displayName: 'Critical'}
    ];

    const filteredTweets = tweets.filter((tweet) => {
        if (!tweet) return false;
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

    // Function to get a profile name for each disaster type
    const getProfileName = (disasterType) => {
        const disasterMap = {
            'flood': 'Emergency Alert',
            'hurricane': 'Weather Network',
            'tornado': 'Storm Alert',
            'earthquake': 'Seismic Alert',
            'fire': 'Fire Watch',
            'wildfire': 'Fire Watch'
        };
        
        const type = disasterType.toLowerCase();
        for (const [key, value] of Object.entries(disasterMap)) {
            if (type.includes(key)) {
                return value;
            }
        }
        return 'Emergency Alert';
    };

    // Get the handle from profile name
    const getProfileHandle = (profileName) => {
        return '@' + profileName.toLowerCase().replace(/\s+/g, '_');
    };

    // Function to load more tweets
    const loadMoreTweets = () => {
        setVisibleTweetCount(prevCount => prevCount + 3);
    };

    // Function to refresh tweets
    const refreshTweets = async () => {
        const {data, error} = await supabase
            .from('multiprocessing_gen_ai_output')
            .select('tweet_text, disaster_type, location, severity_score, timestamp')
            .eq('genuine_disaster', true)
            .order('timestamp', {ascending: false});

        if (error) {
            console.error('Error refreshing tweets:', error);
        } else {
            console.log('Refreshed data:', data);
            setTweets(data);
            // Reset to show only first 3 tweets
            setVisibleTweetCount(3);
        }
    };

    // Function to get time ago format
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return "recently";
        const now = new Date();
        const tweetTime = new Date(timestamp);
        const diffMinutes = Math.floor((now - tweetTime) / (1000 * 60));
        
        if (diffMinutes < 1) return "just now";
        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${Math.floor(diffHours / 24)} days ago`;
    };

    return (
        <div className={"recent-watch " + (className || "")}>
            <div className="content-wrapper">
                <div className="title">Recent Watch Feed</div>

                <div className="tweet-cards">
                    <div className="tweet-cards-header">
                        <div className="filter-container">
                            <div className="filter-row">
                                <div className="filter-item">
                                    <label htmlFor="disasterFilter">Disaster Type</label>
                                    <select
                                        id="disasterFilter"
                                        value={selectedDisaster !== null ? selectedDisaster : ''}
                                        onChange={(e) => setSelectedDisaster(e.target.value || null)}
                                    >
                                        <option value="">Select</option>
                                        {[...new Set(tweets.filter(t=>t).map(tweet => tweet.disaster_type.toLowerCase()))]
                                            .map(disasterType => (
                                                <option key={disasterType} value={disasterType}>{disasterType}</option>))}
                                    </select>
                                </div>
                                
                                <div className="filter-item">
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
                                            <option key={range.label} value={range.label}>{range.displayName} ({range.label})</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="filter-item">
                                    <label htmlFor="cityFilter">Location</label>
                                    <input
                                        id="cityFilter"
                                        type="text"
                                        placeholder="e.g., Houston"
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                    />
                                </div>
                                
                                <div className="filter-item">
                                    <button className="reset-filters-btn" onClick={resetFilters}>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {filteredTweets.length > 0 ? (filteredTweets.slice(0, visibleTweetCount).map((tweet, index) => {
                        if (!tweet) return null;
                        const severityScore = Number(tweet.severity_score);
                        const severityRange = severityRanges.find(range =>
                            severityScore >= range.min && severityScore <= range.max
                        ) || severityRanges[0];
                        
                        const profileName = getProfileName(tweet.disaster_type);
                        const profileHandle = getProfileHandle(profileName);
                        
                        return (
                            <div key={index} className={`tweet-card severity-${severityRange.className}`}>
                                <div className="tweet-header">
                                    <div className="tweet-author">
                                        <div className="profile-img">
                                            <img
                                                src="/bluesky_logo.png"
                                                alt="Profile"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div className="author-info">
                                            <div className="author-name">{profileName}</div>
                                            <div className="author-handle">{profileHandle}</div>
                                        </div>
                                    </div>
                                    <div className={`severity-badge ${severityRange.className}`}>
                                        {severityRange.displayName}
                                    </div>
                                </div>
                                
                                <div className="tweet-content">{tweet.tweet_text}</div>
                                
                                <div className="tweet-meta">
                                    <div className="tweet-location">
                                        <span>📍</span> {tweet.location}
                                    </div>
                                    <div className="tweet-time">
                                        <span>🕒</span> {getTimeAgo(tweet.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })) : (<p>No tweets match the selected filters.</p>)}
                    
                    {filteredTweets.length > visibleTweetCount && (
                        <button className="load-more-btn" onClick={loadMoreTweets}>
                            Load More
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};