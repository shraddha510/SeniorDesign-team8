import React, {useState} from 'react';
import '../styles/RecentWatch.css';

// tweetData taken from TweetTable.js for now
const tweetData = [
    {
        postContent: "Trapped in our house, fire all around! Please send help!",
        location: "Los Angeles, CA",
        disasterType: "Wildfire",
        severity: {level: "High", score: 9, color: "high"},
        lastUpdated: "04/17/25 at 8:25 PM",
    },
    {
        postContent: "Our entire neighborhood is flooded, people on rooftops. No power, no food.",
        location: "New Orleans, LA",
        disasterType: "Flood",
        severity: {level: "High", score: 9, color: "high"},
        lastUpdated: "04/15/25 at 6:40 PM",
    },
    {
        postContent: "Tornado ripped through our town, homes destroyed, people missing. We need help ASAP!",
        location: "Oklahoma City, OK",
        disasterType: "Tornado",
        severity: {level: "High", score: 8, color: "high"},
        lastUpdated: "04/18/25 at 3:30 PM",
    },
    {
        postContent: "Earthquake hit! My apartment collapsed, people are trapped under rubble. Emergency services needed NOW!",
        location: "San Francisco, CA",
        disasterType: "Earthquake",
        severity: {level: "High", score: 8, color: "high"},
        lastUpdated: "04/20/25 at 9:50 AM",
    },
    {
        postContent: "Hurricane destroyed homes, roads blocked, no cell service. We’re running out of supplies.",
        location: "Miami, FL",
        disasterType: "Hurricane",
        severity: {level: "Moderate", score: 7, color: "moderate"},
        lastUpdated: "04/16/25 at 5:15 PM",
    },
    {
        postContent: "Major landslide just happened, a few houses got buried! Emergency crews needed.",
        location: "Seattle, WA",
        disasterType: "Landslide",
        severity: {level: "Moderate", score: 6, color: "moderate"},
        lastUpdated: "04/19/25 at 11:45 AM",
    },
    {
        postContent: "Floodwaters rising fast, some elderly neighbors stuck in their homes!",
        location: "Houston, TX",
        disasterType: "Flood",
        severity: {level: "Moderate", score: 6, color: "moderate"},
        lastUpdated: "04/21/25 at 7:00 AM",
    },
    {
        postContent: "Wildfire spreading fast, we can’t see through the smoke. Trying to evacuate but roads are blocked.",
        location: "Denver, CO",
        disasterType: "Wildfire",
        severity: {level: "Moderate", score: 6, color: "moderate"},
        lastUpdated: "04/22/25 at 2:30 PM",
    },
    {
        postContent: "Aftershocks keep hitting, buildings shaking. People are scared.",
        location: "Anchorage, AK",
        disasterType: "Earthquake",
        severity: {level: "Moderate", score: 5, color: "moderate"},
        lastUpdated: "04/23/25 at 4:10 PM",
    },
    {
        postContent: "Tornado warning just hit, some damage already visible. Hoping it doesn’t get worse.",
        location: "Wichita, KS",
        disasterType: "Tornado",
        severity: {level: "Moderate", score: 5, color: "moderate"},
        lastUpdated: "04/24/25 at 10:20 AM",
    },
];


export const RecentWatch = ({className}) => {
    const [selectedDisaster, setSelectedDisaster] = useState(null);
    const [selectedSeverity, setSelectedSeverity] = useState(null);
    const [selectedCity, setSelectedCity] = useState("");

    const filteredTweets = tweetData.filter((tweet) => {
        const matchesDisaster = selectedDisaster === null || tweet.disasterType === selectedDisaster;
        const matchesSeverity = selectedSeverity === null || tweet.severity.score === selectedSeverity;
        const matchesCity = selectedCity === "" || tweet.location.toLowerCase().includes(selectedCity.toLowerCase());

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
                        {[...new Set(tweetData.map(tweet => tweet.disasterType))]
                            .map(disasterType => (
                                <option key={disasterType} value={disasterType}>{disasterType}</option>))}
                    </select>
                </div>

                <div className="filter-section">
                    <label htmlFor="severityFilter">Severity Score:</label>
                    <select
                        id="severityFilter"
                        value={selectedSeverity !== null ? selectedSeverity : ''}
                        onChange={(e) => setSelectedSeverity(Number(e.target.value) || null)}
                    >
                        <option value="">Select a severity score</option>
                        {[...new Set(tweetData.map(tweet => tweet.severity.score))]
                            .sort((a, b) => a - b)
                            .map(score => (<option key={score} value={score}>{score}</option>))}
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
                    <div key={index} className={`tweet-card tweet-severity-${tweet.severity.color}`}>
                        <img
                            className="bluesky-logo"
                            src="/bluesky_logo.png"
                            alt="BlueSky Logo"
                        />

                        <p className="tweet-content">{tweet.postContent}</p>
                        <p className="tweet-info">
                            <span className="tweet-location">{tweet.location}</span> - {tweet.disasterType}
                            <span className="tweet-severity"> (Score: {tweet.severity.score})</span>
                        </p>
                    </div>
                ))) : (<p className="no-tweets">No tweets match the selected filters.</p>)}
            </div>
        </div>
    );
};