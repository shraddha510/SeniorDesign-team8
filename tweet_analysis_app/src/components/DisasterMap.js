import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
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
    ];

    return (
        <MapContainer center={[37.7749, -122.4194]} zoom={5} style={{ height: "500px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {disasterData.map((disaster, index) => {
                const markerColor = getSeverityColor(disaster.severity);
                const customIcon = new Icon({
                    iconUrl: `https://www.mapbox.com/mapbox-gl-js/assets/icons/marker-icon-${markerColor}.png`,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    tooltipAnchor: [16, -28],
                });

                return (
                    <Marker
                        key={index}
                        position={[disaster.latitude, disaster.longitude]}
                        icon={customIcon}
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
