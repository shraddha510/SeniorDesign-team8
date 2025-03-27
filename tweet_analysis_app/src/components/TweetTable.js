import React, { useState, useEffect } from "react";
import '../styles/TweetTable.css';
import { supabase } from '../supabase';

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

        // Now try our specific query - filtering for genuine disasters with non-null severity scores 
        // and sorting by severity_score in descending order
        const { data, error } = await supabase
          .from('gen_ai_output')
          .select('*')
          .eq('genuine_disaster', true)
          .not('severity_score', 'is', null)
          .order('severity_score', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Raw data from Supabase:', data);

        // Transform the data to match our table structure
        // Only include tweets that have a valid severity score
        const transformedData = data
          .filter(tweet => {
            const severityScore = parseFloat(tweet.severity_score || tweet['Severity Score'] || 0);
            return !isNaN(severityScore) && severityScore > 0;
          })
          .map((tweet, index) => {
            const severityScore = parseFloat(tweet.severity_score || tweet['Severity Score']);
            return {
              rank: index + 1,
              postContent: tweet.tweet || tweet.tweet_text || tweet.Tweet || 'No content',
              location: tweet.location || tweet.Location || 'Not Specified',
              disasterType: tweet.disaster_type || tweet.matched_disaster_keywords || tweet['Disaster Type'] || 'Not Specified',
              severity: {
                level: getSeverityLevel(severityScore),
                score: severityScore,
                color: getSeverityColor(severityScore)
              },
              lastUpdated: tweet.timestamp || tweet.Timestamp ? new Date(tweet.timestamp || tweet.Timestamp).toLocaleString() : 'Unknown'
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
      <p className="table-subtitle">Genuine disasters ranked by severity score</p>

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
          {tweets.length > 0 ? (
            tweets.map((tweet) => (
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
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{textAlign: "center"}}>No genuine disaster data with severity scores available. Please check your Supabase connection and RLS policies.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopTweetsTable;