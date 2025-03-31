import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import Select from "react-select";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "../styles/Analytics.css";
import KPICarousel from "./KPICarousel.js";

// Color palette 
const COLORS = ["#FF6666", "#FFCC33", "#66CC66", "#6699FF"];

const Analytics = () => {
  // ------------------ State Variables ------------------
  const [disasterTrends, setDisasterTrends] = useState([]);
  const [affectedLocations, setAffectedLocations] = useState([]);
  const [emergencyStats, setEmergencyStats] = useState([]);
  const [kpiStats, setKPIStats] = useState({
    totalDisasters: 0,
    activeDisasters: [],
    tweetsLast24h: 0,
    avgSeverity: 0,
  });

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [severityThreshold, setSeverityThreshold] = useState(0);

  // ------------------ Filtered + Computed Data ------------------

  // Filter data by type, date, and severity
  const filteredData = useMemo(() => {
    return disasterTrends
      .filter(item => selectedTypes.length === 0 || selectedTypes.includes(item.type))
      .filter(item => {
        const itemDate = new Date(item.date);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;
        return (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);
      })
      .filter(item => item.severity >= severityThreshold);
  }, [disasterTrends, selectedTypes, dateRange, severityThreshold]);

  // Group filtered data for multi-line & stacked bar charts
  const groupedLineChartData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(({ date, type, tweets }) => {
      if (!grouped[date]) grouped[date] = { date };
      grouped[date][type] = (grouped[date][type] || 0) + tweets;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

  // Filter affected locations using topDisaster + severity
  const filteredAffectedLocations = useMemo(() => {
    return affectedLocations
      .filter(item => selectedTypes.length === 0 || selectedTypes.includes(item.topDisaster))
      .filter(item => item.avgSeverity >= severityThreshold);
  }, [affectedLocations, selectedTypes, severityThreshold]);

  // Build severity distribution by disaster type
  const severityByDisasterType = useMemo(() => {
    const map = {};
    filteredData.forEach(({ type, severity }) => {
      if (!map[type]) map[type] = { type, Low: 0, Moderate: 0, High: 0 };
      if (severity < 4) map[type].Low++;
      else if (severity < 7) map[type].Moderate++;
      else map[type].High++;
    });
    return Object.values(map);
  }, [filteredData]);

  // ------------------ Mock Data Setup ------------------
  useEffect(() => {
    setDisasterTrends([
      { date: "2025-03-10", type: "Flood", tweets: 120, severity: 6 },
      { date: "2025-03-10", type: "Hurricane", tweets: 80, severity: 4 },
      { date: "2025-03-11", type: "Flood", tweets: 150, severity: 7 },
      { date: "2025-03-11", type: "Hurricane", tweets: 90, severity: 5 },
      { date: "2025-03-12", type: "Flood", tweets: 200, severity: 8 },
      { date: "2025-03-12", type: "Hurricane", tweets: 150, severity: 6 },
      { date: "2025-03-13", type: "Flood", tweets: 250, severity: 9 },
      { date: "2025-03-13", type: "Hurricane", tweets: 170, severity: 7 },
    ]);

    setAffectedLocations([
      { location: "Florida", tweets: 950, avgSeverity: 7, topDisaster: "Hurricane" },
      { location: "Texas", tweets: 800, avgSeverity: 4, topDisaster: "Flood" },
      { location: "Maine", tweets: 620, avgSeverity: 2, topDisaster: "Flood" },
      { location: "Georgia", tweets: 400, avgSeverity: 5, topDisaster: "Hurricane" },
    ]);

    setEmergencyStats({
      totalRequests: 150,
      pending: 45,
      resolved: 105,
    });

    setKPIStats({
      totalDisasters: 2050,
      activeDisasters: ["Flood", "Earthquake"],
      tweetsLast24h: 670,
      avgSeverity: 6.3,
    });
  }, []);

  // ------------------ Dashboard ------------------

  return (
    <div className="analytics-container">
      <h1 className="title2">Disaster Analytics Dashboard</h1>
      <KPICarousel kpiStats={kpiStats} emergencyStats={emergencyStats} />

      {/* ------------------ Filter Section ------------------ */}
      <div className="filter-card">
        <div className="filter-header"><h2>Filter Data</h2></div>
        <div className="filter-group">
          {/* Disaster Type */}
          <div className="filter-item">
            <label>Disaster Type</label>
            <Select
              isMulti
              options={["Flood", "Earthquake", "Hurricane", "Tornado", "Fire", "Other"].map(v => ({ value: v, label: v }))}
              value={selectedTypes.map((type) => ({ value: type, label: type }))}
              onChange={(selected) => setSelectedTypes(selected.map((s) => s.value))}
              className="custom-select"
            />
          </div>

          {/* Date Range */}
          <div className="filter-item full-width">
            <label>Date Range</label>
            <div className="date-range-row">
              <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
              <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />
            </div>
          </div>

          {/* Minimum Severity */}
          <div className="filter-item full-width">
            <label>Minimum Severity: <strong>{severityThreshold}</strong></label>
            <Slider
              min={0}
              max={10}
              step={1}
              value={severityThreshold}
              onChange={(value) => setSeverityThreshold(value)}
              trackStyle={{ backgroundColor: "#2A5DB0" }}
              handleStyle={{ borderColor: "#2A5DB0" }}
            />
          </div>
        </div>

        {/* Reset */}
        <div className="filter-actions">
          <button
            className="reset-btn"
            onClick={() => {
              setSelectedTypes([]);
              setDateRange({ from: "", to: "" });
              setSeverityThreshold(0);
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ------------------ Charts Section ------------------ */}
      <div className="analytics-grid">
        {/* Chart 1: Disaster Trends */}
        <ChartWrapper title="Disaster Trends Over Time" description="Tracks disaster-related tweet volume by type over time.">
          {selectedTypes.length > 0 && groupedLineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={groupedLineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedTypes.map((type, i) => (
                  <Line key={type} dataKey={type} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : <NoDataMessage />}
        </ChartWrapper>

        {/* Chart 2: Disaster Type Breakdown */}
        <ChartWrapper title="Disaster Type Breakdown" description="Stacked bars show tweet counts by type per day.">
          {selectedTypes.length > 0 && groupedLineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupedLineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedTypes.map((type, i) => (
                  <Bar key={type} dataKey={type} stackId="a" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataMessage />}
        </ChartWrapper>

        {/* Chart 3: Top Affected Locations */}
        <ChartWrapper title="Top Affected Locations" description="Tweet volume with severity-based color and top disaster.">
          {selectedTypes.length > 0 && filteredAffectedLocations.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredAffectedLocations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="location" type="category" />
                <Tooltip content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <p><strong>{label}</strong></p>
                        <p>Top Disaster: {d.topDisaster}</p>
                        <p>Tweet Count: {d.tweets}</p>
                        <p>Avg. Severity: {d.avgSeverity}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="tweets">
                  {filteredAffectedLocations.map((entry, i) => {
                    let fill = "#66CC66";
                    if (entry.avgSeverity >= 7) fill = "#FF6666";
                    else if (entry.avgSeverity >= 4) fill = "#FFCC33";
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataMessage />}
        </ChartWrapper>

        {/* Chart 4: Severity Distribution */}
        <ChartWrapper title="Severity Distribution" description="Stacked bars show tweet severity levels per disaster type.">
          {selectedTypes.length > 0 && severityByDisasterType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityByDisasterType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Low" stackId="a" fill="#66CC66" />
                <Bar dataKey="Moderate" stackId="a" fill="#FFCC33" />
                <Bar dataKey="High" stackId="a" fill="#FF6666" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataMessage />}
        </ChartWrapper>
      </div>
    </div>
  );
};

// ------------------ Reusable Components ------------------

const ChartWrapper = ({ title, description, children }) => (
  <div className="chart-container">
    <h2>{title}</h2>
    <p className="chart-description">{description}</p>
    {children}
  </div>
);

const NoDataMessage = () => (
  <p style={{ paddingTop: "20px", color: "#999", textAlign: "center" }}>
    Please select disaster types and filters to display data.
  </p>
);

export default Analytics;