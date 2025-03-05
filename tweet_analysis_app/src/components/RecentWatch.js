import React from 'react';
import '../styles/RecentWatch.css';

export const RecentWatch = ({className}) => {
    return (
        <div className={"recent-watch " + className}>
            <div className="header">
                <div className="title">Recent Watch</div>
                <div className="description">
                    Stay up to date on the latest disaster news.
                </div>
            </div>
            <div className="tweet-button">
                <div className="post-button-text">Post to your community</div>
            </div>
            <div className="tweet-examples">
                <div className="tweet-column">
                    <div className="tweet-row">
                        <div className="tweet-row-inner">
                            <div className="tweet-row-inner-row">
                                <div className="poster-info-container">
                                    <div className="profile-picture">
                                        <img
                                            className="image-test"
                                            src="/favicon.ico"
                                            alt={"profile-picture"}/>
                                    </div>
                                    <div className="poster-info">
                                        <div className="poster-name">Person Name</div>
                                        <div className="username">@username</div>
                                    </div>
                                </div>
                                <img
                                    className="twitter-logo"
                                    src="/logo192.png"
                                    alt={"twitter-logo-test"}/>
                            </div>
                            <span
                                className="tweet-caption">
                        Earthquake in the Philippines!
                      </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
