// Imports
import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import "../styles/Analytics.css";

const KPICarousel = ({ kpiStats, emergencyStats }) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  const cards = [
    {
      label: "Total Requests",
      value: emergencyStats.totalRequests,
    },
    {
      label: "Pending Requests",
      value: emergencyStats.pending,
    },
    {
      label: "Resolved Requests",
      value: emergencyStats.resolved,
    },
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
      value: kpiStats.avgSeverity.toFixed(1),
    },
  ];

  const scrollBy = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollBy(240); // Scroll by one card width
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="carousel-wrapper">
      <button className="carousel-nav left" onClick={() => scrollBy(-240)}>
        <FaChevronLeft />
      </button>

      <motion.div
        className="carousel"
        ref={scrollRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        whileTap={{ cursor: "grabbing" }}
      >
        {cards.map((card, index) => (
          <motion.div className="carousel-card" key={index} whileHover={{ scale: 1.05 }}>
            <div className="carousel-value">{card.value}</div>
            <div className="carousel-label">{card.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <button className="carousel-nav right" onClick={() => scrollBy(240)}>
        <FaChevronRight />
      </button>
    </div>
  );
};

export default KPICarousel;
