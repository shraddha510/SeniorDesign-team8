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
            <button
                className="tweet-button"
                onClick={() => window.open("https://bsky.app/")}
            >
                <div className="post-button-text">Post to your community</div>
            </button>


            <div className="tweet-examples">
                <div className="tweet-columns">
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Aftershocks keep hitting, buildings shaking. People are scared.
                      </span>
                    </div>
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                            Trapped in our house, fire all around! Please send help!</span>
                    </div>
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Hurricane destroyed homes, roads blocked, no cell service. We’re running out of supplies.
                      </span>
                    </div>
                </div>
                <div className="tweet-columns">
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Tornado warning just hit, some damage already visible. Hoping it doesn’t get worse.
                      </span>
                    </div>
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Wildfire spreading fast, we can’t see through the smoke. Trying to evacuate but roads are blocked.
                      </span>
                    </div>
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Our entire neighborhood is flooded, people on rooftops. No power, no food.
                      </span>
                    </div>
                </div>
                <div className="tweet-columns">
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Tornado ripped through our town, homes destroyed, people missing. We need help ASAP!
                      </span>
                    </div>
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Earthquake hit! My apartment collapsed, people are trapped under rubble. Emergency services needed NOW!
                      </span>
                    </div>
                    <div className="tweet-card">
                        <div className="tweet-header-container">
                            <div className="poster-info-container">
                                {/*<div className="profile-picture">*/}
                                {/*    <img*/}
                                {/*        className="image-test"*/}
                                {/*        src="/favicon.ico"*/}
                                {/*        alt={"profile-picture"}/>*/}
                                {/*</div>*/}
                                <div className="poster-info">
                                    <div className="poster-name">Person Name</div>
                                    <div className="username">@username</div>
                                </div>
                            </div>
                            <img
                                className="bluesky-logo"
                                src="/bluesky_logo.png"
                                alt={"bluesky logo mini"}/>
                        </div>
                        <span
                            className="tweet-caption">
                        Major landslide just happened, a few houses got buried! Emergency crews needed.
                      </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
