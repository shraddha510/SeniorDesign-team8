import React from "react";
import '../styles/TweetTable.css';

// hard coded for now as example --> once integrated with database, will replace
const tweetData = [
    {
        "rank": 1,
        "postContent": "Trapped in our house, fire all around! Please send help!",
        "location": "Los Angeles, CA",
        "disasterType": "Wildfire",
        "severity": { "level": "High", "score": 9, "color": "high" },
        "lastUpdated": "04/17/25 at 8:25 PM"
    },
    {
        "rank": 2,
        "postContent": "Our entire neighborhood is flooded, people on rooftops. No power, no food.",
        "location": "New Orleans, LA",
        "disasterType": "Flood",
        "severity": { "level": "High", "score": 9, "color": "high" },
        "lastUpdated": "04/15/25 at 6:40 PM"
    },
    {
        "rank": 3,
        "postContent": "Tornado ripped through our town, homes destroyed, people missing. We need help ASAP!",
        "location": "Oklahoma City, OK",
        "disasterType": "Tornado",
        "severity": { "level": "High", "score": 8, "color": "high" },
        "lastUpdated": "04/18/25 at 3:30 PM"
    },
    {
        "rank": 4,
        "postContent": "Earthquake hit! My apartment collapsed, people are trapped under rubble. Emergency services needed NOW!",
        "location": "San Francisco, CA",
        "disasterType": "Earthquake",
        "severity": { "level": "High", "score": 8, "color": "high" },
        "lastUpdated": "04/20/25 at 9:50 AM"
    },
    {
        "rank": 5,
        "postContent": "Hurricane destroyed homes, roads blocked, no cell service. We’re running out of supplies.",
        "location": "Miami, FL",
        "disasterType": "Hurricane",
        "severity": { "level": "Moderate", "score": 7, "color": "moderate" },
        "lastUpdated": "04/16/25 at 5:15 PM"
    },
    {
        "rank": 6,
        "postContent": "Major landslide just happened, a few houses got buried! Emergency crews needed.",
        "location": "Seattle, WA",
        "disasterType": "Landslide",
        "severity": { "level": "Moderate", "score": 6, "color": "moderate" },
        "lastUpdated": "04/19/25 at 11:45 AM"
    },
    {
        "rank": 7,
        "postContent": "Floodwaters rising fast, some elderly neighbors stuck in their homes!",
        "location": "Houston, TX",
        "disasterType": "Flood",
        "severity": { "level": "Moderate", "score": 6, "color": "moderate" },
        "lastUpdated": "04/21/25 at 7:00 AM"
    },
    {
        "rank": 8,
        "postContent": "Wildfire spreading fast, we can’t see through the smoke. Trying to evacuate but roads are blocked.",
        "location": "Denver, CO",
        "disasterType": "Wildfire",
        "severity": { "level": "Moderate", "score": 6, "color": "moderate" },
        "lastUpdated": "04/22/25 at 2:30 PM"
    },
    {
        "rank": 9,
        "postContent": "Aftershocks keep hitting, buildings shaking. People are scared.",
        "location": "Anchorage, AK",
        "disasterType": "Earthquake",
        "severity": { "level": "Moderate", "score": 5, "color": "moderate" },
        "lastUpdated": "04/23/25 at 4:10 PM"
    },
    {
        "rank": 10,
        "postContent": "Tornado warning just hit, some damage already visible. Hoping it doesn’t get worse.",
        "location": "Wichita, KS",
        "disasterType": "Tornado",
        "severity": { "level": "Moderate", "score": 5, "color": "moderate" },
        "lastUpdated": "04/24/25 at 10:20 AM"
    }
];

const TopTweetsTable = () => {
  return (
    <div className="table-container">
      <h2 className="table-title">Top 10 Posts Across The Country</h2>
      <p className="table-subtitle">Ranked by severity score</p>

      <table className="tweets-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Post Content</th>
            <th>Location</th>
            <th>Disaster Type</th>
            <th>Severity</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {tweetData.map((tweet) => (
            <tr key={tweet.id}>
              <td className="rank">{tweet.rank}</td>
              <td>{tweet.postContent}</td>
              <td>{tweet.location}</td>
              <td>{tweet.disasterType}</td>
              <td>
                <span className={`severity-tag ${tweet.severity.color}`}>
                  {tweet.severity.level} ({tweet.severity.score})
                </span>
              </td>
              <td>{tweet.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopTweetsTable;

/* 
const TweetTable = ({ filePath }) => {
    const [tweets, setTweets] = useState([]);

    useEffect(() => {
        fetch(filePath)
            .then(response => response.json())
            .then(data => setTweets(data))
            .catch(error => console.error('Error fetching data:', error));
    }, [filePath]);

    return (
        <table>
            <thead>
                <tr>
                    <th>Tweet ID</th>
                    <th>Timestamp</th>
                    <th>Tweet Text</th>
                    <th>Matched Disaster Keywords</th>
                    <th>Matched Crisis Keywords</th>
                    <th>Hashtags</th>
                    <th>Post URL</th>
                    <th>Sentiment Score</th>
                </tr>
            </thead>
            <tbody>
                {tweets.map(tweet => (
                    <tr key={tweet.tweet_id}>
                        <td>{tweet.tweet_id}</td>
                        <td>{tweet.timestamp}</td>
                        <td>{tweet.tweet_text}</td>
                        <td>{tweet.matched_disaster_keywords}</td>
                        <td>{tweet.matched_crisis_keywords}</td>
                        <td>{tweet.hashtags}</td>
                        <td><a href={tweet.post_url} target="_blank" rel="noopener noreferrer">Link</a></td>
                        <td>{tweet.sentiment_score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
*/