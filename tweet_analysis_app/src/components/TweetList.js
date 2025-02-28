import React, {useEffect, useState} from 'react';

const TweetList = ({filePath}) => {
    const [tweets, setTweets] = useState([]);

    useEffect(() => {
        fetch(filePath)
            .then(response => response.json())
            .then(data => setTweets(data))
            .catch(error => console.error('Error fetching data:', error));
    }, [filePath]);

    return (
        <div>
            <h1>Tweets</h1>
            <ul>
                {tweets.map(tweet => (
                    <li key={tweet.tweet_id}>
                        <p>{tweet.tweet_text}</p>
                        <p>Sentiment Score: {tweet.sentiment_score}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TweetList;