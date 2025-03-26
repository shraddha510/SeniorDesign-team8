import React from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import disasterData from './Example_Disaster_Data';

function HeatmapLayer({ disasters }) {
    const map = useMap();
    const [heatLayer, setHeatLayer] = React.useState(null);
    const infoControlRef = React.useRef(null);

    React.useEffect(() => {
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
        const intensity = disaster.score > 7 ? 1.0 :
            disaster.score > 5 ? 0.7 :
                disaster.score > 3 ? 0.4 : 0.2;

        return [
            disaster.latitude,
            disaster.longitude,
            intensity
        ];
    });

    React.useEffect(() => {
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
                            <h4>${closestDisaster.name}</h4>
                            <p class="popup-detail"><strong>Disaster Type:</strong> ${closestDisaster.disasterType}</p>
                            <p class="popup-detail"><strong>Severity:</strong> ${closestDisaster.severity}</p>
                            <p class="popup-detail"><strong>Risk Score:</strong> ${closestDisaster.score}/10</p>
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
                <HeatmapLayer disasters={disasterData} />
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

            <style jsx>{`
                .map-container {
                    padding: 20px;
                    margin-top: 10px;
                }
                .map-title {
                    text-align: center;
                    font-size: 25px;
                    margin-bottom: 20px;
                    color: #0A2A4A;
                }
                .map-legend {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 30px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    font-family: 'Inter', sans-serif;
                }
                .gradient-bar {
                    background: linear-gradient(to right, #3498db, #2ecc71, #f1c40f, #e67e22, #e74c3c);
                    height: 20px;
                    width: 100%;
                    margin-bottom: 10px;
                }
                .legend-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    font-weight: bold;
                    margin-top: 5px;
                }
                .legend-tip {
                    font-size: 12px;
                    font-style: italic;
                    color: #555;
                    margin-top: 10px;
                    text-align: center;
                }
                .disaster-popup {
                    background: rgba(255, 255, 255, 0.95);
                    padding: 14px;
                    padding-top: 10px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    font-size: 14px;
                    width: 250px;
                }
                .popup-detail {
                    font-size: 13px;
                    color: #333;
                    margin: 4px 0;
                }
                .popup-subtext {
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default DisasterMap;