import React, { useState, useEffect } from "react";
import '../styles/TweetTable.css';
import { supabase } from '../supabase';

const TopTweetsTable = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const fetchTweets = async () => {
      setLoading(true);
      try {
        console.log('Fetching latest timestamp from Supabase...');
        const { data: latestTimestampData, error: latestTimestampError } = await supabase
          .from('multiprocessing_gen_ai_output')
          .select('timestamp')
          .not('timestamp', 'is', null)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestTimestampError) {
          console.error('Supabase error fetching latest timestamp:', latestTimestampError);
          throw latestTimestampError;
        }

        if (!latestTimestampData || !latestTimestampData.timestamp) {
          console.log('No timestamp data found in the table.');
          setCurrentDate('No data available');
          setTweets([]);
          setLoading(false);
          return;
        }

        const latestTimestamp = latestTimestampData.timestamp;
        const latestDateObj = new Date(latestTimestamp);

        const formattedLatestDate = latestDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        setCurrentDate(formattedLatestDate);

        const year = latestDateObj.getUTCFullYear();
        const month = String(latestDateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(latestDateObj.getUTCDate()).padStart(2, '0');
        const startOfDayUTC = `${year}-${month}-${day}T00:00:00.000Z`;
        const endOfDayUTC = `${year}-${month}-${day}T23:59:59.999Z`;

        console.log('Fetching tweets from Supabase for latest date:', formattedLatestDate);
        console.log('Querying between:', startOfDayUTC, 'and', endOfDayUTC);

        const { data, error } = await supabase
          .from('multiprocessing_gen_ai_output')
          .select('*')
          .eq('genuine_disaster', true)
          .not('severity_score', 'is', null)
          .neq('severity_score', 'None')
          .gte('timestamp', startOfDayUTC)
          .lte('timestamp', endOfDayUTC)
          .order('severity_score', { ascending: false })
          .limit(25);

        if (error) {
          console.error('Supabase error fetching tweets:', error);
          throw error;
        }

        console.log('Raw data from Supabase:', data);

        const transformedData = data
          .filter(tweet => {
            const scoreValue = tweet.severity_score ?? tweet['Severity Score'] ?? null;
            if (scoreValue === null || scoreValue === 'None') return false;
            const severityScore = parseFloat(scoreValue);
            const hasValidScore = !isNaN(severityScore) && severityScore > 0;

            const locationValue = tweet.location || tweet.Location || 'Not Specified';
            const hasSpecifiedLocation = locationValue !== 'Not Specified';

            return hasValidScore && hasSpecifiedLocation;
          })
          .slice(0, 10)
          .map((tweet, index) => {
            const severityScore = parseFloat(tweet.severity_score || tweet['Severity Score']);
            const timestampValue = tweet.timestamp || tweet.Timestamp;
            const rawDisasterType = tweet.disaster_type || tweet.matched_disaster_keywords || tweet['Disaster Type'] || 'Not Specified';
            return {
              rank: index + 1,
              postContent: tweet.tweet || tweet.tweet_text || tweet.Tweet || 'No content',
              location: tweet.location || tweet.Location || 'Not Specified',
              disasterType: toTitleCase(rawDisasterType),
              severity: {
                level: getSeverityLevel(severityScore),
                score: severityScore,
                color: getSeverityColor(severityScore)
              },
              lastUpdated: timestampValue ? new Date(timestampValue).toLocaleString() : 'Unknown'
            };
          });

        console.log('Transformed data:', transformedData);
        setTweets(transformedData);
      } catch (error) {
        console.error('Error fetching tweets:', error);
        setCurrentDate('Error loading data');
        setTweets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to convert string to Title Case
  const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return 'Not Specified'; // Handle null/undefined/non-string
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
      <h2 className="table-title">Top 10 Severe Disaster Posts for {currentDate}</h2>
      <p className="table-subtitle">Genuine disasters from the most recent data ranked by severity score</p>

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
                    {tweet.severity.level} ({tweet.severity.score.toFixed(2)})
                  </span>
                </td>
                <td>{tweet.lastUpdated}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{textAlign: "center"}}>
                {currentDate === 'Error loading data'
                  ? 'Error loading data. Please check console or Supabase connection.'
                  : currentDate === 'No data available'
                  ? 'No disaster data found in the database.'
                  : 'No genuine disaster posts with positive severity scores found for the most recent day.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopTweetsTable;