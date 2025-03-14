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
            if (infoControlRef.current) {
                map.removeControl(infoControlRef.current);
            }
        };
    }, [map]);

    const points = disasters.map(disaster => [
        disaster.latitude,
        disaster.longitude,
        disaster.score
    ]);

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