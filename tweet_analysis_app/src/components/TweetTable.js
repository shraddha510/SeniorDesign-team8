import React, { useEffect, useState } from 'react';

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

export default TweetTable;