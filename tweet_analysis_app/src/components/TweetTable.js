import React, { useState, useEffect } from "react";
import '../styles/TweetTable.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const TopTweetsTable = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        console.log('Fetching tweets from Supabase...');
        
        // First, let's check if we can get any data at all
        const { data: allData, error: allDataError } = await supabase
          .from('gen_ai_output')
          .select('*')
          .limit(1);

        if (allDataError) {
          console.error('Error fetching all data:', allDataError);
          throw allDataError;
        }

        console.log('Sample of all data:', allData);

        // Now try our specific query
        const { data, error } = await supabase
          .from('gen_ai_output')
          .select('*')
          .order('severity_score', { ascending: false })  // Changed to lowercase
          .limit(10);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Raw data from Supabase:', data);

        // Transform the data to match our table structure
        const transformedData = data.map((tweet, index) => {
          console.log('Processing tweet:', tweet);
          return {
            rank: index + 1,
            postContent: tweet.tweet || tweet.Tweet,  // Try both cases
            location: tweet.location || tweet.Location || 'Not Specified',
            disasterType: tweet.disaster_type || tweet['Disaster Type'] || 'Not Specified',
            severity: {
              level: getSeverityLevel(parseFloat(tweet.severity_score || tweet['Severity Score'])),
              score: tweet.severity_score || tweet['Severity Score'],
              color: getSeverityColor(parseFloat(tweet.severity_score || tweet['Severity Score']))
            },
            lastUpdated: new Date(tweet.timestamp || tweet.Timestamp).toLocaleString()
          };
        });

        console.log('Transformed data:', transformedData);
        setTweets(transformedData);
      } catch (error) {
        console.error('Error fetching tweets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, []);

  const getSeverityLevel = (score) => {
    if (score >= 8) return 'High';
    if (score >= 5) return 'Moderate';
    return 'Low';
  };

  const getSeverityColor = (score) => {
    if (score >= 8) return 'high';
    if (score >= 5) return 'moderate';
    return 'low';
  };

  if (loading) return <div className="table-container">Loading tweets...</div>;

  return (
    <div className="table-container">
      <h2 className="table-title">Top 10 Disaster Posts Across The Country</h2>
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
          {tweets.map((tweet) => (
            <tr key={tweet.rank}>
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