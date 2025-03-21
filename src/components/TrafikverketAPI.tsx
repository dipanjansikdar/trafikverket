import React, { useState, useEffect } from "react";
import axios from "axios";

// Define types for location and transport data
// Location type contains latitude and longitude
// Transport type defines properties of transport details

type Location = {
    lat: number;
    lon: number;
};

type Transport = {
    ProductAtStop: any;
    name: string; // Transport name (e.g., train number or bus route)
    time: string; // Departure time
    direction: string; // Direction of travel
    track?: string; // Track information (optional)
    stop: string; // Stop name
    catCode: string; // Mode of transport
    line: string; // Mode of transport
};

const ResRobotAPI = () => {
    // Define state variables
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null); // Stores user's location
    const [transportData, setTransportData] = useState<Transport[]>([]); // Stores fetched transport data

    const fetchNearestStation = React.useCallback(async (lat: number, lon: number) => {
        try {
            const apiKey = process.env.REACT_APP_RESROBOT_API_KEY; // API key for authentication
            const response = await axios.get(
                `https://api.resrobot.se/v2.1/location.nearbystops?originCoordLat=${lat}&originCoordLong=${lon}&format=json&accessId=${apiKey}`
            );

            const stations = response.data.stopLocationOrCoordLocation || [];
            if (stations.length > 0) {
                const nearestStation = stations[0].StopLocation;
                fetchTransportData(nearestStation.extId); // Fetch transport data for the nearest station
                console.log(nearestStation.extId);
            } else {
                setError("No station found in your area."); // Set error if no stations are found
            }
        } catch (err) {
            console.error("Error fetching nearest station:", err);
            setError("Failed to fetch station data."); // Handle errors during API call
        }
    }, []);

    useEffect(() => {
        // Check if geolocation is available in the browser
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    setLocation({ lat, lon }); // Save user location
                    fetchNearestStation(lat, lon); // Fetch nearest station based on user's location
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setError("Failed to get location."); // Set error message if geolocation fails
                }
            );
        } else {
            setError("Geolocation is not supported by your browser."); // Inform the user if geolocation is unavailable
        }
    }, [fetchNearestStation]);



    // Function to fetch real-time transport data for a given station
    const fetchTransportData = async (stationId: number | string) => {
        try {
            setLoading(true); // Set loading state while fetching data
            const apiKey = process.env.REACT_APP_RESROBOT_API_KEY;
            const duration = 30; // Time duration to fetch upcoming departures
            const journey = 5; // Max number of journeys to fetch
            const products = 412; // Type of transport services included
            const response = await axios.get(
                `https://api.resrobot.se/v2.1/departureBoard?id=${stationId}&format=json&accessId=${apiKey}&products=${products}&maxJourneys=${journey}&duration=${duration}`
                //`https://api.resrobot.se/v2.1/departureBoard?id=740000001&format=json&accessId=${apiKey}&products=${products}&maxJourneys=${journey}&duration=${duration}`
            );
            setTransportData(response.data.Departure || []); // Store fetched transport data
        } catch (err) {
            console.error("Error fetching transport data:", err);
            setError("Failed to fetch transport data."); // Handle errors
        } finally {
            setLoading(false); // Reset loading state once request completes
        }
    };
    


    return (
        <div>
            <h1>Real-Time Transport Info</h1>
    
            {/* Display user's location if available */}
            {location && <p>Your Location: {location.lat}, {location.lon}</p>}

            {/* Show loading message while fetching data */}
            {loading && <p>Loading transport data...</p>}

            {/* Display error message if there's an issue */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Render transport data in a table */}
            {transportData.length > 0 && (
            <table className="w-full border-collapse border border-gray-300 " >
                <thead>
                    <tr className="bg-gray-200 ">
                        <th className="border border-gray-300 px-4 py-2">Transport</th>
                        <th className="border border-gray-300 px-4 py-2">Mode</th>
                        <th className="border border-gray-300 px-4 py-2">From</th>
                        <th className="border border-gray-300 px-4 py-2">Departure Time</th>
                        <th className="border border-gray-300 px-4 py-2">Destination</th>
                        <th className="border border-gray-300 px-4 py-2">Track</th>
                    </tr>
                </thead>
                <tbody>
                    {transportData.map((transport, index) => (
                    <tr key={index} className="text-center border border-gray-300">
                        <td className="border border-gray-300 px-4 py-2">{transport.name}</td>
                        <td className="border border-gray-300 px-4 py-2">{transport.ProductAtStop.catCode}</td>
                        <td className="border border-gray-300 px-4 py-2">{transport.stop}</td>
                        <td className="border border-gray-300 px-4 py-2">{transport.time}</td>
                        <td className="border border-gray-300 px-4 py-2">{transport.direction}</td>
                        <td className="border border-gray-300 px-4 py-2">{transport.ProductAtStop.line || "N/A"}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        )}
        </div>

    );
};

export default ResRobotAPI;
