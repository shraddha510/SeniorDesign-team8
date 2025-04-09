import React, { useState, useEffect, useRef } from "react";
import "../styles/Analytics.css";

const KPICarousel = ({ kpiStats }) => {
  const cards = [
    {
      label: "Total Disasters Tracked",
      value: kpiStats.totalDisasters,
    },
    {
      label: "Tweets Processed (24h)",
      value: kpiStats.tweetsLast24h,
    },
    {
      label: "Average Severity",
      value: kpiStats.avgSeverity?.toFixed(1) || "0.0",
    },
  ];

  return (
    <div className="kpi-row">
      {cards.map((card, index) => (
        <div className="kpi-block" key={index}>
          <div className="carousel-value">{card.value}</div>
          <div className="carousel-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default KPICarousel;