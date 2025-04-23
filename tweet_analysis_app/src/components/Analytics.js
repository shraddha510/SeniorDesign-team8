import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import Select from "react-select";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "../styles/Analytics.css";
import KPICarousel from "./KPICarousel.js";
import { supabase } from '../supabase';

// Chart color palette
const COLORS = [
  "#FF6666", "#FFCC33", "#66CC66", "#6699FF",
  "#FF99CC", "#9966FF", "#FF9966", "#66FFFF",
  "#CCFF66", "#FF6666", "#00CC99", "#3399FF",
  "#FF6699", "#9999FF", "#FFDE59", "#C70039"
];

// Supported disaster types for filtering
const DISASTER_TYPES = [
  "Flood", "Earthquake", "Hurricane", "Tornado", "Fire",
  "Landslide", "Drought", "Volcano", "Blizzard", "Heatwave",
  "Cold Wave", "Dust Storm", "Tsunami", "Lightning", "Other"
];

const Analytics = () => {
  // -------------------- STATE --------------------
  const [disasterTrends, setDisasterTrends] = useState([]);
  const [affectedLocations, setAffectedLocations] = useState([]);
  const [kpiStats, setKPIStats] = useState({
    totalDisasters: 0,
    activeDisasters: [],
    tweetsLast24h: 0,
    avgSeverity: 0,
  });

  const [chartPage, setChartPage] = useState(0); // Each page = 3 days
  const daysPerPage = 3;

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [severityThreshold, setSeverityThreshold] = useState(0);

  // -------------------- FILTER + TRANSFORM DATA --------------------

  const [locationOptions, setLocationOptions] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Filter dataset by selected types, date range, and severity
  const filteredData = useMemo(() => {
    const filtered = disasterTrends
    .filter(item => selectedTypes.length === 0 || selectedTypes.includes(item.type))
    .filter(item => selectedLocations.length === 0 || selectedLocations.some(loc => loc.value === item.location))
    .filter(item => {
      const date = item.date;
      const from = dateRange.from;
      const to = dateRange.to;
      return (!from || date >= from) && (!to || date <= to);
    })
    .filter(item => severityThreshold === 0 || (item.severity !== null && item.severity >= severityThreshold));

  // debugging
  console.log("Filtered Data Count:", filtered.length);
  console.log("Selected Types:", selectedTypes);
  console.log("Date Range:", dateRange);
  console.log("Selected Locations:", selectedLocations);
  console.log("Severity Threshold:", severityThreshold);

  return filtered;
  }, [disasterTrends, selectedTypes, selectedLocations, dateRange, severityThreshold]);

  // Group tweets by date/type for line & stacked bar chart
  const groupedLineChartData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(({ date, type }) => {
      if (!grouped[date]) grouped[date] = { date };
      grouped[date][type] = (grouped[date][type] || 0) + 1;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredData]);

  const pagedLineChartData = useMemo(() => {
    const start = chartPage * daysPerPage;
    const end = start + daysPerPage;
    return groupedLineChartData.slice(start, end);
  }, [groupedLineChartData, chartPage]);  

  // Filter affected locations by disaster type + severity
  const filteredAffectedLocations = useMemo(() => {
    return affectedLocations
      .filter(item => selectedTypes.length === 0 || selectedTypes.includes(item.topDisaster))
      .filter(item => selectedLocations.length === 0 || selectedLocations.some(loc => loc.value === item.location))
      .filter(item => item.avgSeverity >= severityThreshold)
      .filter(item => {
        const date = item.lastDate;
        const from = dateRange.from;
        const to = dateRange.to;
        return (!from || date >= from) && (!to || date <= to);
      });
  }, [affectedLocations, selectedTypes, selectedLocations, severityThreshold, dateRange]);
  

  // Shorten long location labels for Y-axis
  const MAX_LABEL_LENGTH = 25;
  const shortenedLocations = useMemo(() => {
    const sorted = [...filteredAffectedLocations]
      .filter(loc => loc.location && loc.location.trim() !== "") 
      .sort((a, b) => b.tweets - a.tweets);
      
    const topN = sorted.slice(0, 10);
  
    return topN.map((item) => ({
      ...item,
      shortLabel: item.location.length > MAX_LABEL_LENGTH
        ? item.location.slice(0, MAX_LABEL_LENGTH) + "..."
        : item.location || "(Unknown Location)",
    }));
  }, [filteredAffectedLocations]);  
  
  // Build severity counts per disaster type
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

  const ALL_OPTION = { value: "ALL", label: "All Types" };
  const TYPE_OPTIONS = [ALL_OPTION, ...DISASTER_TYPES.map(v => ({ value: v, label: v }))];

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year}`;
  };
  
  useEffect(() => {
    // After affectedLocations is set:
    const unique = [...new Set(disasterTrends.map(item => item.location))];
    setLocationOptions(unique.map(loc => ({ value: loc, label: loc })));
  }, [disasterTrends]);

  const [severityPage, setSeverityPage] = useState(0);
  const typesPerPage = 5;

  const pagedSeverityData = useMemo(() => {
    const start = severityPage * typesPerPage;
    const end = start + typesPerPage;
    return severityByDisasterType.slice(start, end);
  }, [severityByDisasterType, severityPage]);
  


  // -------------------- FETCH DATA FROM SUPABASE --------------------

  useEffect(() => {
    const fetchData = async () => {
      let allData = [];
      let start = 0;
      const chunkSize = 1000;
      let done = false;

      while (!done) {
        const { data, error } = await supabase
          .from("multiprocessing_gen_ai_output")
          .select("*")
          .eq("genuine_disaster", true)
          .range(start, start + chunkSize - 1);
      
        if (error) {
          console.error("Supabase Error:", error);
          break;
        }
      
        if (data.length === 0) {
          done = true;
        } else {
          allData = allData.concat(data);
          start += chunkSize;
          if (data.length < chunkSize) done = true;
        }
      }

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      let total = 0, sumSeverity = 0, recentDate = null, tweetsByDate = {};
      const trends = [], locationMap = {};
      const recentTypes = new Set();
      
      // Convert raw disaster type into normalized categories
      const normalizeDisasterType = (raw) => {
        const lower = raw.toLowerCase();
        if (lower.includes("flood") || lower.includes("inundation")) return "Flood";
        if (lower.includes("fire") || lower.includes("wildfire") || lower.includes("blaze")) return "Fire";
        if (lower.includes("quake") || lower.includes("aftershock") || lower.includes("seismic")) return "Earthquake";
        if (lower.includes("hurricane") || lower.includes("cyclone") || lower.includes("typhoon") || lower.includes("storm")) return "Hurricane";
        if (lower.includes("tornado") || lower.includes("twister") || lower.includes("funnel")) return "Tornado";
        if (lower.includes("landslide") || lower.includes("mudslide") || lower.includes("debris")) return "Landslide";
        if (lower.includes("drought") || lower.includes("dry spell") || lower.includes("water shortage")) return "Drought";
        if (lower.includes("volcano") || lower.includes("eruption") || lower.includes("lava")) return "Volcano";
        if (lower.includes("blizzard") || lower.includes("snowstorm") || lower.includes("whiteout")) return "Blizzard";
        if (lower.includes("heatwave") || lower.includes("heat wave") || lower.includes("record temperature")) return "Heatwave";
        if (lower.includes("cold wave") || lower.includes("freeze") || lower.includes("ice storm")) return "Cold Wave";
        if (lower.includes("dust storm") || lower.includes("sandstorm")) return "Dust Storm";
        if (lower.includes("tsunami") || lower.includes("tidal wave")) return "Tsunami";
        if (lower.includes("lightning") || lower.includes("thunderstorm")) return "Lightning";
        return "Other";
      };

      // Process each tweet row
      allData.forEach((entry) => {
        const timestamp = new Date(entry.timestamp);
        const type = normalizeDisasterType(entry.disaster_type);
        const severityVal = Number(entry.severity_score);
        const dateStr = timestamp.toISOString().split("T")[0];

        if (!isNaN(severityVal)) {
          sumSeverity += severityVal;
          total++;
        }

        // Save tweet in trends
        const item = {
          date: dateStr,
          type,
          severity: severityVal,
          location: entry.location
        };
        trends.push(item);

        // Count tweets by date
        tweetsByDate[dateStr] = (tweetsByDate[dateStr] || 0) + 1;

        // Track most recent date
        if (!recentDate || new Date(dateStr) > new Date(recentDate)) {
          recentDate = dateStr;
        }

        // Group location stats
        if (!locationMap[item.location]) {
          locationMap[item.location] = {
            location: item.location,
            tweets: 0,
            totalSeverity: 0,
            count: 0,
            topDisasterCount: {}
          };
        }

        const loc = locationMap[item.location];
        loc.tweets++;
        loc.totalSeverity += severityVal;
        loc.count++;
        loc.topDisasterCount[type] = (loc.topDisasterCount[type] || 0) + 1;
        loc.lastDate = dateStr; 

        if (dateStr === recentDate) recentTypes.add(type);
      });

      console.log("Total processed disasterTrends:", trends.length);

      // Process location stats and update state
      setDisasterTrends(trends);
      setAffectedLocations(Object.values(locationMap).map(loc => {
        const topDisaster = Object.entries(loc.topDisasterCount).sort((a, b) => b[1] - a[1])[0][0];
        return {
          location: loc.location,
          tweets: loc.tweets,
          avgSeverity: +(loc.totalSeverity / loc.count).toFixed(1),
          topDisaster,
          lastDate: loc.lastDate, 
        };
      }));      
      
      // Update KPI Stats
      setKPIStats({
        totalDisasters: total,
        tweetsLast24h: tweetsByDate[recentDate] || 0, // Use most recent available day
        avgSeverity: total > 0 ? +(sumSeverity / total).toFixed(1) : 0,
        activeDisasters: Array.from(recentTypes)
      });      
    };

    fetchData();
  }, []);

  // -------------------- RENDER UI --------------------

  return (
    <div className="analytics-container">
      <h1 className="title2">Disaster Analytics Dashboard</h1>

      {/* KPI Cards */}
      <KPICarousel 
        kpiStats={kpiStats} 
      />

      {/* Filter Panel */}
      <div className="filter-card">
        <div className="filter-header"><h2>Filter Data</h2></div>
        <div className="filter-group">
          {/* Type filter */}
          <div className="filter-item">
            <label>Disaster Type</label>
            <Select
              isMulti
              options={TYPE_OPTIONS}
              value={
                selectedTypes.length === DISASTER_TYPES.length
                  ? [ALL_OPTION] // show just one "All Types" pill
                  : selectedTypes.map(type => ({ value: type, label: type }))
              }
              onChange={(selectedOptions, actionMeta) => {
                if (!selectedOptions) {
                  setSelectedTypes([]); // when everything is cleared
                  return;
                }

                const values = selectedOptions.map(opt => opt.value);

                if (values.includes("ALL")) {
                  setSelectedTypes(DISASTER_TYPES); // select all types
                } else {
                  setSelectedTypes(values); // select only clicked types
                }
              }}
              className="custom-select"
            />
          </div>

          {/* Date range */}
          <div className="filter-item full-width">
            <label>Date Range</label>
            <div className="date-range-row">
              <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
              <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
            </div>
          </div>

          {/* Location filter */}      
          <div className="filter-item full-width">
            <label>Location</label>
            <Select
              isMulti
              options={locationOptions}
              value={selectedLocations}
              onChange={(selected) => setSelectedLocations(selected || [])}
              className="custom-select"
              placeholder="Select Location(s)"
            />
          </div>

          {/* Severity filter */}
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

        {/* Reset Filters */}
        <div className="filter-actions">
          <button className="reset-btn" onClick={() => {
            setSelectedTypes([]);
            setSelectedLocations([]);
            setDateRange({ from: "", to: "" });
            setSeverityThreshold(0);
          }}>Reset Filters</button>
        </div>
      </div>

      {/* CHARTS */}
      <div className="analytics-grid">
        {/* Disaster Trends Over Time */}
        <ChartWrapper title="Disaster Trends Over Time" description="Tracks disaster-related tweet volume by type over time.">
          {selectedTypes.length && groupedLineChartData.length ? (
            <div className="chart-wrapper-with-nav">
              <div className="chart-nav-top-right">
                <button
                  onClick={() => setChartPage(prev => Math.max(prev - 1, 0))}
                  disabled={chartPage === 0}
                  className="chart-nav-btn"
                >
                  &#8592;
                </button>
                <button
                  onClick={() => setChartPage(prev =>
                    (chartPage + 1) * daysPerPage < groupedLineChartData.length ? prev + 1 : prev
                  )}
                  disabled={(chartPage + 1) * daysPerPage >= groupedLineChartData.length}
                  className="chart-nav-btn"
                >
                  &#8594;
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pagedLineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip labelFormatter={formatDate} />
                  <Legend
                    content={({ payload }) => {
                      const count = payload.length;
                      const firstRowCount = count <= 8 ? count : Math.ceil(count / 2);
                      const secondRowCount = count <= 8 ? 0 : count - firstRowCount;
                      const topRow = payload.slice(0, firstRowCount);
                      const bottomRow = payload.slice(firstRowCount);

                      const renderRow = (items) => (
                        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "4px", flexWrap: "wrap" }}>
                          {items.map((entry, index) => (
                            <div key={`legend-${index}`} style={{ display: "flex", alignItems: "center", fontSize: 12 }}>
                              <div style={{
                                width: 10,
                                height: 10,
                                backgroundColor: entry.color,
                                marginRight: 6,
                                borderRadius: 2
                              }} />
                              {entry.value}
                            </div>
                          ))}
                        </div>
                      );

                      return (
                        <div>
                          {renderRow(topRow)}
                          {secondRowCount > 0 && renderRow(bottomRow)}
                        </div>
                      );
                    }}
                  />
                  {selectedTypes.map((type, i) => (
                    <Line key={type} dataKey={type} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <NoDataMessage />}
        </ChartWrapper>

        {/* Disaster Type Breakdown */}
        <ChartWrapper title="Disaster Type Breakdown" description="Stacked bars show tweet counts by type per day.">
          {selectedTypes.length && groupedLineChartData.length ? (
            <div className="chart-wrapper-with-nav">
              <div className="chart-nav-top-right">
                <button
                  onClick={() => setChartPage(prev => Math.max(prev - 1, 0))}
                  disabled={chartPage === 0}
                  className="chart-nav-btn"
                >
                  &#8592;
                </button>
                <button
                  onClick={() => setChartPage(prev =>
                    (chartPage + 1) * daysPerPage < groupedLineChartData.length ? prev + 1 : prev
                  )}
                  disabled={(chartPage + 1) * daysPerPage >= groupedLineChartData.length}
                  className="chart-nav-btn"
                >
                  &#8594;
                </button>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pagedLineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip labelFormatter={formatDate} />
                  <Legend
                    content={({ payload }) => {
                      const count = payload.length;
                      const firstRowCount = count <= 8 ? count : Math.ceil(count / 2);
                      const secondRowCount = count <= 8 ? 0 : count - firstRowCount;
                      const topRow = payload.slice(0, firstRowCount);
                      const bottomRow = payload.slice(firstRowCount);

                      const renderRow = (items) => (
                        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "4px", flexWrap: "wrap" }}>
                          {items.map((entry, index) => (
                            <div key={`legend-${index}`} style={{ display: "flex", alignItems: "center", fontSize: 12 }}>
                              <div style={{
                                width: 10,
                                height: 10,
                                backgroundColor: entry.color,
                                marginRight: 6,
                                borderRadius: 2
                              }} />
                              {entry.value}
                            </div>
                          ))}
                        </div>
                      );

                      return (
                        <div>
                          {renderRow(topRow)}
                          {secondRowCount > 0 && renderRow(bottomRow)}
                        </div>
                      );
                    }}
                  />
                  {selectedTypes.map((type, i) => (
                    <Bar key={type} dataKey={type} stackId="a" fill={COLORS[i % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <NoDataMessage />}
        </ChartWrapper>

        {/* Top 10 Affected Locations */}
        <ChartWrapper title="Top 10 Affected Locations" description="Tweet volume with severity-based color and top disaster.">
          {selectedTypes.length && filteredAffectedLocations.length ? (
            <>
              {/* Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shortenedLocations} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="shortLabel" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: "#fff", padding: "12px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                            <strong>{label}</strong>
                            <p>Top Disaster: {d.topDisaster}</p>
                            <p>Tweet Count: {d.tweets}</p>
                            <p>Avg. Severity: {d.avgSeverity}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="tweets">
                    {shortenedLocations.map((entry, i) => {
                      let fill = "#66CC66"; // low
                      if (entry.avgSeverity >= 7) fill = "#FF6666"; // high
                      else if (entry.avgSeverity >= 4) fill = "#FFCC33"; // moderate
                      return <Cell key={i} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Custom Severity Key */}
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 13 }}>
                    <div style={{ width: 12, height: 12, backgroundColor: "#66CC66", marginRight: 6, borderRadius: 2 }}></div>
                    Low
                  </div>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 13 }}>
                    <div style={{ width: 12, height: 12, backgroundColor: "#FFCC33", marginRight: 6, borderRadius: 2 }}></div>
                    Moderate
                  </div>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 13 }}>
                    <div style={{ width: 12, height: 12, backgroundColor: "#FF6666", marginRight: 6, borderRadius: 2 }}></div>
                    High
                  </div>
                </div>
              </>
          ) : <NoDataMessage />}
        </ChartWrapper>

        {/* Severity Distribution */}
        <ChartWrapper title="Severity Distribution" description="Stacked bars show tweet severity levels per disaster type.">
          {selectedTypes.length && severityByDisasterType.length ? (
            <div className="chart-wrapper-with-nav">
              <div className="chart-nav-top-right">
                <button
                  onClick={() => setSeverityPage(prev => Math.max(prev - 1, 0))}
                  disabled={severityPage === 0}
                  className="chart-nav-btn"
                >
                  &#8592;
                </button>
                <button
                  onClick={() => setSeverityPage(prev =>
                    (prev + 1) * typesPerPage < severityByDisasterType.length ? prev + 1 : prev
                  )}
                  disabled={(severityPage + 1) * typesPerPage >= severityByDisasterType.length}
                  className="chart-nav-btn"
                >
                  &#8594;
                </button>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pagedSeverityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Low" stackId="a" fill="#66CC66" />
                  <Bar dataKey="Moderate" stackId="a" fill="#FFCC33" />
                  <Bar dataKey="High" stackId="a" fill="#FF6666" />
                </BarChart>
              </ResponsiveContainer>

              {/* Custom Legend */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 12, gap: 20, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center" }}><div style={{ backgroundColor: "#66CC66", width: 10, height: 10, marginRight: 6 }} />Low</div>
                <div style={{ display: "flex", alignItems: "center" }}><div style={{ backgroundColor: "#FFCC33", width: 10, height: 10, marginRight: 6 }} />Moderate</div>
                <div style={{ display: "flex", alignItems: "center" }}><div style={{ backgroundColor: "#FF6666", width: 10, height: 10, marginRight: 6 }} />High</div>
              </div>
            </div>
          ) : <NoDataMessage />}
        </ChartWrapper>
      </div>
    </div>
  );
};

// Reusable wrapper for each chart section
const ChartWrapper = ({ title, description, children }) => (
  <div className="chart-container">
    <h2>{title}</h2>
    <p className="chart-description">{description}</p>
    {children}
  </div>
);

// Fallback when no chart data exists
const NoDataMessage = () => (
  <p style={{ paddingTop: "20px", color: "#999", textAlign: "center" }}>
    Please select disaster types and filters to display data.
  </p>
);

export default Analytics;