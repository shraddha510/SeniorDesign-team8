import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function HeatmapLayer({ disasters }) {
    const map = useMap();
    const [heatLayer, setHeatLayer] = useState(null);
    const infoControlRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        const InfoControl = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'info-control');
                container.style.padding = '6px 8px';
                container.style.background = 'white';
                container.style.background = 'rgba(255,255,255,0.8)';
                container.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
                container.style.borderRadius = '5px';
                container.style.minWidth = '250px';
                container.innerHTML = '<h4>Hover over a location</h4>';
                return container;
            }
        });

        const infoControl = new InfoControl();
        map.addControl(infoControl);
        infoControlRef.current = infoControl;

        return () => {
            if (infoControlRef.current) {g
                map.removeControl(infoControlRef.current);
            }
        };
    }, [map]);

    const points = disasters.map(disaster => [
        disaster.latitude,
        disaster.longitude,
        disaster.score
    ]);

    useEffect(() => {
        if (!map || !L.heatLayer) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
            script.async = true;
            script.onload = () => createHeatmap();
            document.body.appendChild(script);
            return () => {
                document.body.removeChild(script);
            };
        } else {
            createHeatmap();
        }

        function createHeatmap() {
            if (heatLayer) map.removeLayer(heatLayer);

            const heat = L.heatLayer(points, {
                radius: 35,
                blur: 25,
                maxZoom: 10,
                max: 9,
                gradient: { 0.3: 'blue', 0.45: 'green', 0.6: 'yellow', 0.75: 'orange', 0.9: 'red' },
                minOpacity: 0.5
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
                            <h4>${closestDisaster.name}</h4>
                            <p><strong>Disaster Type:</strong> ${closestDisaster.disasterType}</p>
                            <p><strong>Severity:</strong> ${closestDisaster.severity}</p>
                            <p><strong>Risk Score:</strong> ${closestDisaster.score}/10</p>
                        `;
                    } else {
                        container.innerHTML = '<h4>Hover over a disaster area</h4>';
                    }
                }
            });
        }

        return () => {
            if (heatLayer) map.removeLayer(heatLayer);
            map.off('mousemove');
        };
    }, [map, points, disasters]);

    return null;
}

const DisasterMap = () => {
    const disasterData = [
        {
            name: "Los Angeles, CA",
            latitude: 34.0522,
            longitude: -118.2437,
            disasterType: "Wildfire",
            severity: "High",
            score: 9
        },
        {
            name: "New Orleans, LA",
            latitude: 29.7604,
            longitude: -90.0750,
            disasterType: "Flood",
            severity: "High",
            score: 9
        },
        {
            name: "Miami, FL",
            latitude: 25.7617,
            longitude: -80.1918,
            disasterType: "Hurricane",
            severity: "Moderate",
            score: 7
        },
        {
            name: "Houston, TX",
            latitude: 29.7604,
            longitude: -95.3698,
            disasterType: "Hurricane Damage",
            severity: "High",
            score: 8
        },
        {
            name: "Phoenix, AZ",
            latitude: 33.4484,
            longitude: -112.0740,
            disasterType: "Extreme Heat Wave",
            severity: "Moderate",
            score: 6
        },
        {
            name: "San Francisco, CA",
            latitude: 37.7749,
            longitude: -122.4194,
            disasterType: "Earthquake Risk",
            severity: "Low",
            score: 4
        },
        {
            name: "Seattle, WA",
            latitude: 47.6062,
            longitude: -122.3321,
            disasterType: "Landslide",
            severity: "Moderate",
            score: 5
        },
        {
            name: "Denver, CO",
            latitude: 39.7392,
            longitude: -104.9903,
            disasterType: "Blizzard",
            severity: "Low",
            score: 3
        },
        {
            name: "Joplin, MO",
            latitude: 37.0842,
            longitude: -94.5133,
            disasterType: "Tornado Damage",
            severity: "High",
            score: 8
        },
        {
            name: "Honolulu, HI",
            latitude: 21.3069,
            longitude: -157.8583,
            disasterType: "Volcanic Activity",
            severity: "Moderate",
            score: 6
        },
        {
            name: "Anchorage, AK",
            latitude: 61.2181,
            longitude: -149.9003,
            disasterType: "Earthquake",
            severity: "High",
            score: 7
        },
        {
            name: "Charleston, SC",
            latitude: 32.7765,
            longitude: -79.9311,
            disasterType: "Hurricane Flooding",
            severity: "Moderate",
            score: 6
        }
    ];

    return (
        <div className="map-container">
            <h2>US Disaster Risk Heatmap</h2>
            <MapContainer
                center={[39.8283, -98.5795]}
                zoom={4}
                style={{ height: "500px", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <HeatmapLayer disasters={disasterData} />
            </MapContainer>
            <div className="map-legend">
                <h3>Disaster Risk Legend</h3>
                <div className="gradient-bar">
                    <div style={{ background: 'linear-gradient(to right, blue, green, yellow, orange, red)', height: '20px', width: '100%' }}></div>
                    <div className="legend-labels">
                        <span>Low Risk</span>
                        <span>High Risk</span>
                    </div>
                </div>
                <p className="legend-tip">Move your cursor over colored areas to see disaster details</p>
            </div>
            <style jsx>{`
                .map-container {
                    margin: 20px 0;
                }
                .map-legend {
                    margin-top: 10px;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    background-color: white;
                }
                .gradient-bar {
                    margin: 10px 0;
                }
                .legend-labels {
                    display: flex;
                    justify-content: space-between;
                }
                .legend-tip {
                    font-style: italic;
                    font-size: 0.9em;
                    margin-top: 10px;
                }
                h3 {
                    margin-bottom: 10px;
                }
            `}</style>
        </div>
    );
};

export default DisasterMap;