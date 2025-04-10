import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabase';
import '../styles/DisasterMap.css';

function ScrollHandler({ map }) {
    useEffect(() => {
        if (!map) return;
        map.scrollWheelZoom.disable();

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

function HeatmapLayer({ disasters }) {
    const map = useMap();
    const [heatLayer, setHeatLayer] = useState(null);
    const infoControlRef = React.useRef(null);
    const heatmapCreatedRef = React.useRef(false);

    // Create info panel
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
            if (infoControlRef.current) map.removeControl(infoControlRef.current);
        };
    }, [map]);

    // Create points for heatmap
    const points = disasters.map(disaster => {
        const intensity = disaster.severity_score > 7 ? 1.0 :
            disaster.severity_score > 5 ? 0.7 :
                disaster.severity_score > 3 ? 0.4 : 0.2;
        return [disaster.latitude, disaster.longitude, intensity];
    });

    // Create heatmap and hover handler
    useEffect(() => {
        if (!map) return;
        heatmapCreatedRef.current = false;

        // Create heatmap
        const setupHeatLayer = () => {
            if (heatmapCreatedRef.current) return;
            heatmapCreatedRef.current = true;

            if (heatLayer) map.removeLayer(heatLayer);
            if (points.length === 0) return;

            const heat = L.heatLayer(points, {
                radius: 30, blur: 25, maxZoom: 1, max: 1.0,
                gradient: { 0.0: 'blue', 0.2: 'green', 0.4: 'yellow', 0.7: 'orange', 1.0: 'red' }
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

        // Handle hover to show disaster details
        const mouseMoveHandler = (e) => {
            const latlng = e.latlng;
            let closestDist = Infinity;
            let closestDisaster = null;

            disasters.forEach(disaster => {
                const disasterLatLng = L.latLng(disaster.latitude, disaster.longitude);
                const distance = latlng.distanceTo(disasterLatLng);
                if (distance < 100000 && distance < closestDist) {
                    closestDist = distance;
                    closestDisaster = disaster;
                }
            });

            const container = infoControlRef.current?._container;
            if (container) {
                if (closestDisaster) {
                    container.innerHTML = `
                        <h4>${closestDisaster.disaster_type || 'Unknown Disaster'}</h4>
                        <p class="popup-detail"><strong>Severity:</strong> ${closestDisaster.severity_score || 'Unknown'}/10</p>
                        <p class="popup-detail"><strong>Location:</strong> ${closestDisaster.location || 'Unknown'}</p>
                        <p class="popup-detail"><strong>Tweets:</strong> ${closestDisaster.tweet_count}</p>
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
        return () => map.off('mousemove', mouseMoveHandler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, points, disasters]);

    return <ScrollHandler map={map} />;
}

// Main component
const DisasterMap = () => {
    const [disasters, setDisasters] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTable] = useState('fake_gen_ai_output');

    // Fetch and process data
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const { data, error } = await supabase.from(activeTable).select('*');

                if (error) throw error;
                if (!data || data.length === 0) {
                    setDisasters([]);
                    setIsLoading(false);
                    return;
                }

                // Group nearby disasters and count tweets
                const grouped = {};

                data.forEach(disaster => {
                    if (!disaster.disaster_type || !disaster.location) return;

                    const lat = parseFloat(disaster.latitude);
                    const lng = parseFloat(disaster.longitude);
                    if (isNaN(lat) || isNaN(lng)) return;

                    // Clean basic data
                    const type = disaster.disaster_type.trim().toLowerCase();
                    const location = disaster.location.trim().toLowerCase();

                    // Try to find a match in existing groups
                    let foundMatch = false;

                    for (const key in grouped) {
                        const existing = grouped[key];
                        const existingType = existing.disaster_type.trim().toLowerCase();

                        // Match if same type and either:
                        // 1. Similar location name, or
                        // 2. Very close coordinates
                        if (existingType === type && (
                            existing.location.toLowerCase().includes(location) ||
                            location.includes(existing.location.toLowerCase()) ||
                            (Math.abs(existing.latitude - lat) < 0.5 && Math.abs(existing.longitude - lng) < 0.5)
                        )) {
                            // Add to existing group
                            const currentSeverity = parseFloat(disaster.severity_score) || 0;
                            if (currentSeverity > existing.severity_score) {
                                existing.severity_score = currentSeverity;
                            }
                            existing.tweet_count += 1;
                            foundMatch = true;
                            break;
                        }
                    }

                    // Create new group if no match found
                    if (!foundMatch) {
                        const newKey = `${type}_${location}_${lat}_${lng}`;
                        grouped[newKey] = {
                            ...disaster,
                            severity_score: parseFloat(disaster.severity_score) || 0,
                            tweet_count: 1
                        };
                    }
                });

                setDisasters(Object.values(grouped));
                setIsLoading(false);

            } catch (err) {
                setError(err);
                setIsLoading(false);
            }
        }

        fetchData();
    }, [activeTable]);

    return (
        <div className="map-container">
            <h2 className="map-title">Disaster Risk Heatmap</h2>

            {/* Map instructions */}
            <div className="map-instructions">
                <div className="info-icon">i</div>
                <div>
                    <strong>Map Navigation:</strong> Use <kbd>Ctrl</kbd> + Scroll to zoom the map. Regular scrolling will navigate the page.
                </div>
            </div>

            {/* Map with loading/error states */}
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
                    <HeatmapLayer disasters={disasters} />
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