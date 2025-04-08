import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabase';
import '../styles/DisasterMap.css';

function HeatmapLayer({ disasters }) {
    const map = useMap();
    const [heatLayer, setHeatLayer] = useState(null);
    const infoControlRef = React.useRef(null);

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

    const points = disasters.map(disaster => {
        const intensity = disaster.severity_score > 7 ? 1.0 :
            disaster.severity_score > 5 ? 0.7 :
                disaster.severity_score > 3 ? 0.4 : 0.2;

        return [disaster.latitude, disaster.longitude, intensity];
    });

    useEffect(() => {
        if (!map || !L.heatLayer) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
            script.async = true;
            script.onload = () => createHeatmap();
            document.body.appendChild(script);
            return () => document.body.removeChild(script);
        } else {
            createHeatmap();
        }

        function createHeatmap() {
            if (heatLayer) map.removeLayer(heatLayer);

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

            map.on('mousemove', function (e) {
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
            });
        }

        return () => {
            if (heatLayer) map.removeLayer(heatLayer);
            map.off('mousemove');
        };
    }, [map, points, disasters, heatLayer]);

    return null;
}

const DisasterMap = () => {
    const [disasters, setDisasters] = useState([]);

    useEffect(() => {
        const fetchDisasterData = async () => {
            const { data, error } = await supabase
                .from('gen_ai_output')
                .select('disaster_type, location, severity_score, latitude, longitude');

            if (error) {
                console.error('Error fetching data:', error);
                return;
            }

            const grouped = {};

            data.forEach(disaster => {
                const lat = parseFloat(disaster.latitude);
                const lng = parseFloat(disaster.longitude);

                if (isNaN(lat) || isNaN(lng)) return;

                const key = `${disaster.disaster_type}_${disaster.location}_${lat}_${lng}`;

                if (!grouped[key]) {
                    grouped[key] = {
                        ...disaster,
                        severity_score: parseFloat(disaster.severity_score) || 0,
                        latitude: lat,
                        longitude: lng,
                        tweet_count: 1
                    };
                } else {
                    grouped[key].tweet_count += 1;
                }
            });

            setDisasters(Object.values(grouped));
        };

        fetchDisasterData();
    }, []);

    return (
        <div className="map-container">
            <h2 className="map-title">US Disaster Risk Heatmap</h2>
            <MapContainer
                center={[39.8283, -98.5795]}
                zoom={4}
                style={{ height: "500px", width: "100%", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <HeatmapLayer disasters={disasters} />
            </MapContainer>

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