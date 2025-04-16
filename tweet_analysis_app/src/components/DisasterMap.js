import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabase';
import '../styles/DisasterMap.css';

function toTitleCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Custom component to handle scroll behavior for the map
 * Allows page scrolling by default and map zooming with Ctrl+scroll
 */
function ScrollHandler({ map }) {
    useEffect(() => {
        if (!map) return;

        // Disable default scroll wheel zoom
        map.scrollWheelZoom.disable();

        // Custom handler: Ctrl+scroll to zoom, regular scroll to navigate page
        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.deltaY < 0 ? map.zoomIn(1) : map.zoomOut(1);
            }
        };

        map._container.addEventListener('wheel', handleWheel);
        return () => map._container.removeEventListener('wheel', handleWheel);
    }, [map]);

    return null;
}

/**
 * Creates a heatmap layer showing disaster intensity
 * Handles both the heatmap creation and hover interactions
 */
function HeatmapLayer({ disasters }) {
    const map = useMap();
    const [heatLayer, setHeatLayer] = useState(null);
    const infoControlRef = React.useRef(null);
    const heatmapCreatedRef = React.useRef(false);

    // Set up info panel in the top right
    useEffect(() => {
        if (!map) return;

        const InfoControl = L.Control.extend({
            options: { position: 'topright' },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'info-control disaster-popup');
                container.innerHTML = `
                    <h4>Hover over a disaster area</h4>
                    <p class="popup-subtext">Move your cursor over hotspots for details.</p>
                `;
                return container;
            }
        });

        const infoControl = new InfoControl();
        map.addControl(infoControl);
        infoControlRef.current = infoControl;

        return () => {
            if (infoControlRef.current) {
                map.removeControl(infoControlRef.current);
            }
        };
    }, [map]);

    // Convert disaster data to heatmap points with intensity
    const points = disasters.map(disaster => {
        const intensity = disaster.severity_score > 7 ? 1.0 :
            disaster.severity_score > 5 ? 0.7 :
                disaster.severity_score > 3 ? 0.4 : 0.2;

        return [disaster.latitude, disaster.longitude, intensity];
    });

    // Create the heat layer and set up mouseover
    useEffect(() => {
        heatmapCreatedRef.current = false;
        if (!map) return;

        const setupHeatLayer = () => {
            if (heatmapCreatedRef.current) return;
            heatmapCreatedRef.current = true;

            // Remove existing layer if it exists
            if (heatLayer) map.removeLayer(heatLayer);
            if (points.length === 0) return;

            // Create new heat layer
            const heat = L.heatLayer(points, {
                radius: 30,
                blur: 25,
                maxZoom: 1,
                max: 1.0,
                gradient: {
                    0.0: 'blue',
                    0.2: 'green',
                    0.4: 'yellow',
                    0.7: 'orange',
                    1.0: 'red'
                }
            }).addTo(map);

            setHeatLayer(heat);
        };

        // Load heatmap library if needed
        if (!L.heatLayer) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
            script.async = true;
            script.onload = setupHeatLayer;
            document.body.appendChild(script);
            return () => {
                if (script.parentNode) document.body.removeChild(script);
            };
        } else {
            setupHeatLayer();
        }

        // Set up mousemove handler for finding closest disaster
        const mouseMoveHandler = function (e) {
            const latlng = e.latlng;
            let closestDist = Infinity;
            let closestDisaster = null;

            // Find closest disaster to cursor
            disasters.forEach(disaster => {
                const disasterLatLng = L.latLng(disaster.latitude, disaster.longitude);
                const distance = latlng.distanceTo(disasterLatLng);

                if (distance < 100000 && distance < closestDist) {
                    closestDist = distance;
                    closestDisaster = disaster;
                }
            });

            // Update info panel
            const container = infoControlRef.current?._container;
            if (container) {
                if (closestDisaster) {
                    container.innerHTML = `
                    <h4>${toTitleCase(closestDisaster.disaster_type || 'Unknown Disaster')}</h4>
                    <p class="popup-detail"><strong>Severity:</strong> ${closestDisaster.severity_score || 'Unknown'}/10</p>
                    <p class="popup-detail"><strong>Location:</strong> ${closestDisaster.location || 'Unknown'}</p>
                    <p class="popup-detail"><strong>Number of Tweets:</strong> ${closestDisaster.tweet_count}</p>
                    <p class="popup-detail"><strong>Date:</strong> ${closestDisaster.timestamp ? new Date(closestDisaster.timestamp).toLocaleDateString() : 'Unknown'}</p>
                `;
                } else {
                    container.innerHTML = `
                        <h4>Hover over a disaster area</h4>
                        <p class="popup-subtext">Move your cursor over hotspots for details.</p>
                    `;
                }
            }
        };

        map.on('mousemove', mouseMoveHandler);
        return () => {
            map.off('mousemove', mouseMoveHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, points, disasters]);

    return <ScrollHandler map={map} />;
}

/**
 * Date range picker component for filtering disaster data
 */
function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onApplyFilter }) {
    return (
        <div className="date-filter-container">
            <div className="filter-title">Filter by Date:</div>
            <div className="date-input-group">
                <label htmlFor="start-date">From:</label>
                <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                />
            </div>
            <div className="date-input-group">
                <label htmlFor="end-date">To:</label>
                <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                />
            </div>
            <button className="apply-filter-btn" onClick={onApplyFilter}>
                Apply
            </button>
        </div>
    );
}

/**
 * Main disaster map component
 * Fetches data and renders map with heatmap layer
 */
const DisasterMap = () => {
    const [disasters, setDisasters] = useState([]);
    const [filteredDisasters, setFilteredDisasters] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTable] = useState('multiprocessing_gen_ai_output');

    // Calculate default date range (one week ago to today)
    const getDefaultDates = () => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Format dates as YYYY-MM-DD for input elements
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            startDate: formatDate(oneWeekAgo),
            endDate: formatDate(today)
        };
    };

    const defaultDates = getDefaultDates();

    // State for date filtering with dynamic defaults
    const [startDate, setStartDate] = useState(defaultDates.startDate);
    const [endDate, setEndDate] = useState(defaultDates.endDate);
    const [appliedStartDate, setAppliedStartDate] = useState(defaultDates.startDate);
    const [appliedEndDate, setAppliedEndDate] = useState(defaultDates.endDate);

    // Handle filter application
    const handleApplyFilter = () => {
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
    };

    // Filter disasters based on date range
    useEffect(() => {
        if (disasters.length === 0) {
            setFilteredDisasters([]);
            return;
        }

        const filtered = disasters.filter(disaster => {
            if (!disaster.timestamp) return false;

            const disasterDate = new Date(disaster.timestamp);
            const startDateObj = new Date(appliedStartDate);
            const endDateObj = new Date(appliedEndDate);

            // Set end date to end of day for inclusive filtering
            endDateObj.setHours(23, 59, 59, 999);

            return disasterDate >= startDateObj && disasterDate <= endDateObj;
        });

        setFilteredDisasters(filtered);
    }, [disasters, appliedStartDate, appliedEndDate]);

    // Fetch disaster data from Supabase
    useEffect(() => {
        const fetchDisasterData = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from(activeTable)
                    .select('*');

                if (error) {
                    setError(error);
                    setIsLoading(false);
                    return;
                }

                if (!data || data.length === 0) {
                    setDisasters([]);
                    setIsLoading(false);
                    return;
                }

                processData(data);
                setIsLoading(false);
            } catch (err) {
                setError(err);
                setIsLoading(false);
            }
        };

        // Process data and group similar disasters
        const processData = (data) => {
            const grouped = {}; // Initialize 'dictionary'

            data.forEach(disaster => {
                // Skip entries with missing essential data
                if (!disaster.disaster_type || !disaster.location) return;

                const lat = parseFloat(disaster.latitude);
                const lng = parseFloat(disaster.longitude);
                if (isNaN(lat) || isNaN(lng)) return;

                // Clean up data and normalize type
                const disasterType = disaster.disaster_type.trim().toLowerCase();

                // Create key using disaster type and rounded coordinates
                const key = `${disasterType}_${lat.toFixed(1)}_${lng.toFixed(1)}`;

                // Check if we already have a group with this key
                if (grouped[key]) {
                    // Add to existing group - update severity if needed
                    const currentSeverity = parseFloat(disaster.severity_score);
                    if (currentSeverity > grouped[key].severity_score) {
                        grouped[key].severity_score = currentSeverity;
                    }
                    grouped[key].tweet_count += 1;
                } else {
                    // Create new group
                    grouped[key] = {
                        ...disaster,
                        severity_score: parseFloat(disaster.severity_score),
                        latitude: lat,
                        longitude: lng,
                        tweet_count: 1
                    };
                }
            });

            setDisasters(Object.values(grouped));
        };

        fetchDisasterData();
    }, [activeTable]);

    return (
        <div className="map-container">
            <h2 className="map-title">Disaster Risk Heatmap</h2>

            {/* Date filter component */}
            <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApplyFilter={handleApplyFilter}
            />

            {/* Filter status display */}
            <div className="filter-status">
                Showing disasters from {new Date(appliedStartDate).toLocaleDateString()} to {new Date(appliedEndDate).toLocaleDateString()}
                {filteredDisasters.length > 0 ? ` (${filteredDisasters.length} events)` : ''}
            </div>

            {/* Map instruction banner */}
            <div className="map-instructions">
                <div className="info-icon">i</div>
                <div>
                    <strong>Map Navigation:</strong> Use <kbd>Ctrl</kbd> + Scroll to zoom the map. Regular scrolling will navigate the page.
                </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="loading-container">
                    <p>Loading disaster data...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p>Error loading data: {error.message || "Unknown error"}</p>
                </div>
            ) : (
                <MapContainer
                    center={[39.8283, -98.5795]}
                    zoom={4}
                    className="disaster-map"
                    zoomControl={false}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <ZoomControl position="bottomright" />
                    <HeatmapLayer disasters={filteredDisasters} />
                </MapContainer>
            )}

            {/* Legend */}
            <div className="map-legend">
                <h3>Disaster Risk Legend</h3>
                <div className="gradient-bar"></div>
                <div className="legend-labels">
                    <span>Low Risk</span>
                    <span>High Risk</span>
                </div>
                <p className="legend-tip">Move your cursor over colored areas to see disaster details</p>
            </div>
        </div>
    );
};

export default DisasterMap;