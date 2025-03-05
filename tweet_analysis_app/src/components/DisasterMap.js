import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'High':
            return 'red';
        case 'Moderate':
            return 'orange';
        case 'Low':
            return 'green';
        default:
            return 'blue';
    }
};

const createMarkerIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: 30px; 
                height: 30px; 
                border-radius: 50% 50% 50% 0;
                background: ${color};
                position: absolute;
                transform: rotate(-45deg);
                left: 50%;
                top: 50%;
                margin: -15px 0 0 -15px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            ">
                <div style="
                    transform: rotate(45deg);
                    color: white;
                    text-align: center;
                    line-height: 30px;
                "></div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

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
            name: "San Francisco, CA",
            latitude: 37.7749,
            longitude: -122.4194,
            disasterType: "Earthquake Watch",
            severity: "Low",
            score: 4
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
        <MapContainer center={[37.7749, -122.4194]} zoom={5} style={{ height: "500px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {disasterData.map((disaster, index) => {
                const markerColor = getSeverityColor(disaster.severity);

                return (
                    <Marker
                        key={index}
                        position={[disaster.latitude, disaster.longitude]}
                        icon={createMarkerIcon(markerColor)}
                    >
                        <Popup>
                            <strong>{disaster.name}</strong><br />
                            Disaster Type: {disaster.disasterType}<br />
                            Severity: {disaster.severity} (Score: {disaster.score})
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default DisasterMap;