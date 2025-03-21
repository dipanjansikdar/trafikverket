import React, { useState, useEffect } from "react";
import axios from "axios";

type Location = {
    lat: number;
    lon: number;
};

type Transport = {
    name: string;
    time: string;
    direction: string;
    track?: string;
    stop: string;
};

const ResRobotAPI = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [transportData, setTransportData] = useState<Transport[]>([]);


    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    setLocation({ lat, lon });
                    fetchNearestStation(lat, lon);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setError("Failed to get location.");
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    }, []);

    const fetchNearestStation = async (lat: number, lon: number) => {
        try {
            const apiKey = process.env.REACT_APP_RESROBOT_API_KEY;
            const response = await axios.get(
                `https://api.resrobot.se/v2.1/location.nearbystops?originCoordLat=${lat}&originCoordLong=${lon}&format=json&accessId=${apiKey}`
            );

            const stations = response.data.stopLocationOrCoordLocation || [];
            if (stations.length > 0) {
                const nearestStation = stations[0].StopLocation;
                fetchTransportData(nearestStation.extId);
                console.log(nearestStation.extId);
            } else {
                setError("No station found in your area.");
            }
        } catch (err) {
            console.error("Error fetching nearest station:", err);
            setError("Failed to fetch station data.");
        }
    };

    const fetchTransportData = async (stationId: number | string) => {
        try {
            setLoading(true);
            const apiKey = process.env.REACT_APP_RESROBOT_API_KEY;
            const duration = 30;
            const journey = 5;
            const products = 16;
            const response = await axios.get(
               // `https://api.resrobot.se/v2.1/departureBoard?id=${stationId}&format=json&accessId=${apiKey}`
                `https://api.resrobot.se/v2.1/departureBoard?id=${stationId}&format=json&accessId=${apiKey}&products=${products}&maxJourneys=${journey}&duration=${duration}`

            );
            setTransportData(response.data.Departure || []);

        } catch (err) {
            console.error("Error fetching transport data:", err);
            setError("Failed to fetch transport data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>🚆 ResRobot Real-Time Transport Info</h1>
            {location && <p>📍 Your Location: {location.lat}, {location.lon}</p>}
            {loading && <p>Loading transport data...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <ul>
                {transportData.map((transport, index) => (
                    <li key={index}>
                        <h3>🚄 {transport.name}</h3>
                        <p>📍 From: {transport.stop}</p>
                        <p>🕒 {transport.time}</p>
                        <p>📍 To: {transport.direction}</p>
                        <p>🛤 Track: {transport.track || "N/A"}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResRobotAPI;
